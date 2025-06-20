// src/app/story/actions.ts
'use server';

import { generateStoryTurn } from '@/ai/flows/generate-story-turn-flow';
import type { StoryTurnInput, StoryTurnOutput, UserStoryProgress } from '@/lib/types';
import { getCharacterMetadata, getInteractiveStory, getUserStoryProgress, updateUserStoryProgress } from '@/lib/firebase/rtdb';

interface StoryTurnResponse {
  aiResponse?: StoryTurnOutput;
  error?: string;
  nextProgress?: UserStoryProgress;
}

export async function handleStoryMessageAction(
  userId: string,
  userName: string,
  storyId: string,
  userMessageOrChoice: string // This can be user's typed message OR text of a choice button
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
    if (currentUserProgress?.currentTurnContext?.summaryOfCurrentSituation && userMessageOrChoice !== "Let's begin the story!") {
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
        previousUserChoice: userMessageOrChoice,
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
    
    const newCurrentTurnContext: UserStoryProgress['currentTurnContext'] = {
      summaryOfCurrentSituation: aiResponse.narrationForThisTurn,
      previousUserChoice: userMessageOrChoice,
      choiceA: aiResponse.choiceA || null, // Store null if not provided
      choiceB: aiResponse.choiceB || null, // Store null if not provided
    };

    const progressUpdateData = {
      currentTurnContext: newCurrentTurnContext,
      storyTitleSnapshot: story.title,
      characterIdSnapshot: story.characterId,
      userChoiceThatLedToThis: userMessageOrChoice,
      newAiNarration: aiResponse.narrationForThisTurn,
      offeredChoiceA: aiResponse.choiceA || null,
      offeredChoiceB: aiResponse.choiceB || null,
    };
    
    await updateUserStoryProgress(userId, storyId, progressUpdateData);
    
    const updatedProgress = await getUserStoryProgress(userId, storyId);

    return { aiResponse, nextProgress: updatedProgress };

  } catch (error) {
    console.error('Error in handleStoryMessageAction. StoryId:', storyId, 'UserMessageOrChoice:', userMessageOrChoice, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the story AI.';
    return { error: errorMessage };
  }
}
