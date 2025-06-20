// src/app/story/actions.ts
'use server';

import { generateStoryTurn } from '@/ai/flows/generate-story-turn-flow';
import type { StoryTurnInput, StoryTurnOutput, UserStoryProgress } from '@/lib/types';
import { getCharacterMetadata, getInteractiveStory, getUserStoryProgress, updateUserStoryProgress } from '@/lib/firebase/rtdb';

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

    let currentUserProgress = await getUserStoryProgress(userId, storyId);
    
    // Determine the AI's context (summaryOfCurrentSituation) for this turn
    let summaryForAICurrentTurn: string;
    if (currentUserProgress?.currentTurnContext?.summaryOfCurrentSituation && userChoiceText !== "Let's begin the story!") {
      // If there's existing progress and it's not the initial call,
      // the summaryOfCurrentSituation from *that* progress is the context.
      summaryForAICurrentTurn = currentUserProgress.currentTurnContext.summaryOfCurrentSituation;
    } else {
      // This is for the very first turn or if "Let's begin the story!" is passed
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
        summaryOfCurrentSituation: summaryForAICurrentTurn, // AI's previous narration or initial summary
        previousUserChoice: userChoiceText, // User's choice that leads to the NEW situation
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
    
    // This newCurrentTurnContext will be saved as the "current" state for the next user interaction.
    // The aiResponse.narrationForThisTurn is the AI's output for *this* turn.
    const newCurrentTurnContext: UserStoryProgress['currentTurnContext'] = {
      summaryOfCurrentSituation: aiResponse.narrationForThisTurn, // AI's new narration for this turn
      previousUserChoice: userChoiceText,                         // User's choice that led to this narration
      choiceA: aiResponse.choiceA,                                // New choice A from AI
      choiceB: aiResponse.choiceB,                                // New choice B from AI
    };

    // Data to be passed to updateUserStoryProgress for creating the history entry
    // and updating the overall progress document.
    const progressUpdateData = {
      currentTurnContext: newCurrentTurnContext,
      storyTitleSnapshot: story.title,
      characterIdSnapshot: story.characterId,
      userChoiceThatLedToThis: userChoiceText,        // The user's choice just made
      newAiNarration: aiResponse.narrationForThisTurn, // The AI's narration in response to that choice
    };
    
    await updateUserStoryProgress(userId, storyId, progressUpdateData);
    
    // Fetch the just-updated progress to ensure consistency and include the new history
    const updatedProgress = await getUserStoryProgress(userId, storyId); 

    return { aiResponse, nextProgress: updatedProgress };

  } catch (error) {
    console.error('Error in handleStoryChoiceAction. StoryId:', storyId, 'UserChoice:', userChoiceText, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the story AI.';
    return { error: errorMessage };
  }
}
