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

// Renamed from handleStoryChoiceAction to handleStoryMessageAction
export async function handleStoryMessageAction(
  userId: string,
  userName: string, // User's display name
  storyId: string,
  userMessage: string // User's typed message
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
    if (currentUserProgress?.currentTurnContext?.summaryOfCurrentSituation && userMessage !== "Let's begin the story!") {
      summaryForAICurrentTurn = currentUserProgress.currentTurnContext.summaryOfCurrentSituation;
    } else {
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
        summaryOfCurrentSituation: summaryForAICurrentTurn, 
        previousUserChoice: userMessage, // User's typed message
      },
    };

    const aiResponse = await generateStoryTurn(aiInput);

    if (
      !aiResponse ||
      typeof aiResponse.narrationForThisTurn !== 'string' ||
      aiResponse.narrationForThisTurn.trim() === ''
    ) {
      console.error(
        'AI response missing narrationForThisTurn or it is empty. StoryId:', storyId, 
        'Input to AI:', JSON.stringify(aiInput),
        'AI Response:', JSON.stringify(aiResponse)
      );
      return { error: 'Failed to get a complete story response from AI. Please try again.' };
    }
    
    // No longer expecting choiceA or choiceB from aiResponse
    const newCurrentTurnContext: UserStoryProgress['currentTurnContext'] = {
      summaryOfCurrentSituation: aiResponse.narrationForThisTurn, 
      previousUserChoice: userMessage,                        
      // choiceA and choiceB are removed
    };

    const progressUpdateData = {
      currentTurnContext: newCurrentTurnContext,
      storyTitleSnapshot: story.title,
      characterIdSnapshot: story.characterId,
      userChoiceThatLedToThis: userMessage,        
      newAiNarration: aiResponse.narrationForThisTurn, 
    };
    
    await updateUserStoryProgress(userId, storyId, progressUpdateData);
    
    const updatedProgress = await getUserStoryProgress(userId, storyId); 

    // Return only narration, as choices are no longer part of the output
    return { aiResponse: { narrationForThisTurn: aiResponse.narrationForThisTurn }, nextProgress: updatedProgress };

  } catch (error) {
    console.error('Error in handleStoryMessageAction. StoryId:', storyId, 'UserMessage:', userMessage, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the story AI.';
    return { error: errorMessage };
  }
}
