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

    let currentUserProgress = await getUserStoryProgress(userId, storyId);
    let summaryForAICurrentTurn: string;
    let previousUserChoiceForAI: string;

    if (currentUserProgress?.currentTurnContext) {
      summaryForAICurrentTurn = currentUserProgress.currentTurnContext.summaryOfCurrentSituation;
      previousUserChoiceForAI = userChoiceText; // The choice that led to *this* new state we are generating
    } else {
      // This is the first turn for this user in this story
      summaryForAICurrentTurn = story.initialSceneSummary;
      previousUserChoiceForAI = "Let's begin the story!"; // Placeholder for the very first turn
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
        summaryOfCurrentSituation: summaryForAICurrentTurn,
        previousUserChoice: previousUserChoiceForAI,
      },
    };

    const aiResponse = await generateStoryTurn(aiInput);

    if (!aiResponse || !aiResponse.narrationForThisTurn) {
      return { error: 'Failed to get a story response from AI.' };
    }

    // Prepare data for updating user's progress
    const nextProgressData: UserStoryProgress = {
      userId,
      storyId,
      currentTurnContext: {
        // The AI's narration for *this* turn becomes the summary for the *next* turn
        summaryOfCurrentSituation: aiResponse.narrationForThisTurn,
        // The choice the user just made (that triggered this AI response)
        previousUserChoice: userChoiceText,
      },
      storyTitleSnapshot: story.title,
      characterIdSnapshot: story.characterId,
      // lastPlayed will be updated by updateUserStoryProgress using serverTimestamp
    };

    await updateUserStoryProgress(userId, storyId, nextProgressData);
    
    const updatedProgress = await getUserStoryProgress(userId, storyId); // Fetch again to get server timestamps if needed by client

    return { aiResponse, nextProgress: updatedProgress || nextProgressData };

  } catch (error) {
    console.error('Error handling story choice action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the story AI.';
    return { error: errorMessage };
  }
}
