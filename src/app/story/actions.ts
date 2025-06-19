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

    if (currentUserProgress?.currentTurnContext?.summaryOfCurrentSituation) {
      summaryForAICurrentTurn = currentUserProgress.currentTurnContext.summaryOfCurrentSituation;
      previousUserChoiceForAI = userChoiceText; 
    } else {
      summaryForAICurrentTurn = story.initialSceneSummary;
      previousUserChoiceForAI = "Let's begin the story!"; 
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
    
    const nextProgressData: UserStoryProgress = {
      userId,
      storyId,
      currentTurnContext: {
        summaryOfCurrentSituation: aiResponse.narrationForThisTurn,
        previousUserChoice: userChoiceText,
      },
      storyTitleSnapshot: story.title,
      characterIdSnapshot: story.characterId,
    };

    await updateUserStoryProgress(userId, storyId, nextProgressData);
    
    const updatedProgress = await getUserStoryProgress(userId, storyId); 

    return { aiResponse, nextProgress: updatedProgress || nextProgressData };

  } catch (error) {
    console.error('Error in handleStoryChoiceAction. StoryId:', storyId, 'UserChoice:', userChoiceText, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the story AI.';
    return { error: errorMessage };
  }
}
