// src/app/story/actions.ts
'use server';

import { generateStoryTurn } from '@/ai/flows/generate-story-turn-flow';
import type { CharacterMetadata, InteractiveStory, StoryTurnInput, StoryTurnOutput, UserStoryProgress } from '@/lib/types';
import { getCharacterMetadata, getInteractiveStory, getUserStoryProgress, updateUserStoryProgress } from '@/lib/firebase/rtdb';
import { User } from 'firebase/auth'; // Assuming user object might be needed

interface StoryTurnResponse {
  aiResponse?: StoryTurnOutput;
  error?: string;
  nextProgress?: UserStoryProgress; // Send back the updated progress
}

export async function handleStoryChoiceAction(
  userId: string,
  userName: string, // User's display name
  storyId: string,
  userChoiceText: string // The text of the choice the user just made
): Promise<StoryTurnResponse> {
  try {
    const story = await getInteractiveStory(storyId);
    if (!story) {
      return { error: 'Story not found.' };
    }

    const character = await getCharacterMetadata(story.characterId);
    if (!character) {
      return { error: `Character for story (ID: ${story.characterId}) not found.` };
    }

    // Get the most recent progress. For the very first turn, this might be null.
    let currentUserProgress = await getUserStoryProgress(userId, storyId);
    
    let summaryForAICurrentTurn: string;

    if (currentUserProgress?.currentTurnContext?.summaryOfCurrentSituation && userChoiceText !== "Let's begin the story!") {
      // If there's existing progress and it's not the initial call,
      // the summaryOfCurrentSituation from *that* progress is the context.
      summaryForAICurrentTurn = currentUserProgress.currentTurnContext.summaryOfCurrentSituation;
    } else {
      // This is for the very first turn or if "Let's begin the story!" is passed (which signals a fresh start/restart)
      summaryForAICurrentTurn = story.initialSceneSummary;
    }

    const aiInput: StoryTurnInput = {
      character: {
        name: character.name,
        styleTags: character.styleTags,
        defaultVoiceTone: character.defaultVoiceTone,
      },
      story: {
        title: story.title,
      },
      user: {
        name: userName,
      },
      currentTurn: {
        summaryOfCurrentSituation: summaryForAICurrentTurn, // This is the AI's narration from *previous* turn, or initial summary
        previousUserChoice: userChoiceText, // This is the choice the user *just* made to get to the *new* situation
      },
    };

    const aiResponse = await generateStoryTurn(aiInput);

    if (
      !aiResponse ||
      typeof aiResponse.narrationForThisTurn !== 'string' ||
      aiResponse.narrationForThisTurn.trim() === '' ||
      typeof aiResponse.choiceA !== 'string' ||
      aiResponse.choiceA.trim() === '' ||
      typeof aiResponse.choiceB !== 'string' ||
      aiResponse.choiceB.trim() === ''
    ) {
      console.error(
        'AI response missing required fields, fields are not strings, or fields are empty. StoryId:', storyId, 
        'Input to AI:', JSON.stringify(aiInput),
        'AI Response:', JSON.stringify(aiResponse)
      );
      return { error: 'Failed to get a complete story response from AI. Please try again.' };
    }
    
    // This `nextProgressData` will be saved to Firebase.
    // `summaryOfCurrentSituation` now stores the AI's *new* narration.
    // `previousUserChoice` stores the `userChoiceText` that led to this *new* narration.
    const nextProgressData: UserStoryProgress = {
      userId,
      storyId,
      currentTurnContext: {
        summaryOfCurrentSituation: aiResponse.narrationForThisTurn, // The AI's new narration
        previousUserChoice: userChoiceText,                      // The user's choice that led to this new narration
        choiceA: aiResponse.choiceA,                             // The new choice A from AI
        choiceB: aiResponse.choiceB,                             // The new choice B from AI
      },
      storyTitleSnapshot: story.title,
      characterIdSnapshot: story.characterId,
      lastPlayed: new Date().getTime(), // Using client time here for simplicity, serverTimestamp can also be used via rtdb
    };

    await updateUserStoryProgress(userId, storyId, nextProgressData);
    
    // Fetch the just-updated progress to ensure consistency, though nextProgressData should be accurate
    const updatedProgress = await getUserStoryProgress(userId, storyId); 

    return { aiResponse, nextProgress: updatedProgress || nextProgressData };

  } catch (error) {
    console.error('Error in handleStoryChoiceAction. StoryId:', storyId, 'UserChoice:', userChoiceText, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the story AI.';
    return { error: errorMessage };
  }
}
