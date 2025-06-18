// src/app/actions.ts
'use server';

import { personalizeDailyMessage } from '@/ai/flows/personalize-daily-message';
import { generatePersonalizedVoiceMessage } from '@/ai/flows/generate-personalized-voice-message';
import { generateVideoReply } from '@/ai/flows/generate-video-replies';
import type { CharacterMetadata, CharacterName } from '@/lib/types'; // Removed MessageDocument and ChatMessageUI as they are for DB/UI
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';
// RTDB operations will be handled by client-side calls to src/lib/firebase/rtdb.ts
// Server actions orchestrate AI calls.

interface AIActionInputMessage { // Simplified structure for AI prompt history
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: number;
}
interface AIResponse {
  text?: string;
  audioDataUri?: string;
  videoDataUri?: string;
  error?: string;
}


export async function handleUserMessageAction(
  userInput: string,
  chatHistory: AIActionInputMessage[], // Simplified history for AI
  characterMeta: CharacterMetadata,
  userId: string, // For potential user-specific AI logic, not directly for DB write here
  chatId: string   // For context (characterId in this setup)
): Promise<AIResponse> {
  try {
    const previousMessagesText = chatHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : characterMeta.name}: ${msg.content}`)
      .join('\n');

    const userPreferencesForAI = `User is interacting with ${characterMeta.name}. 
    Character's persona: ${characterMeta.prompt}. 
    They enjoy flirty, emotional, Bollywood-style dialogues in Hinglish.
    Current user input: ${userInput}`;

    const personalizedMessage = await personalizeDailyMessage({
      userName: 'User', // Placeholder, can be dynamic
      userPreferences: userPreferencesForAI,
      previousMessages: previousMessagesText,
    });

    if (!personalizedMessage || !personalizedMessage.message) {
      return { error: 'Failed to get a text response from AI.' };
    }
    
    const aiTextResponse = personalizedMessage.message;
    let response: AIResponse = { text: aiTextResponse };

    const lowerInput = userInput.toLowerCase();
    let shouldGenerateVoice = false;
    let shouldGenerateVideo = false;

    if (lowerInput.includes('voice') || lowerInput.includes('sing') || lowerInput.includes('awaaz') || lowerInput.includes('gana')) {
        shouldGenerateVoice = true;
    }
    if (lowerInput.includes('video') || lowerInput.includes('dekhna') || lowerInput.includes('show me') || lowerInput.includes('dikhao')) {
        shouldGenerateVideo = true;
    }

    if (shouldGenerateVideo) {
        const videoReply = await generateVideoReply({
            message: aiTextResponse,
            avatarDataUri: characterMeta.avatarUrl || DEFAULT_AVATAR_DATA_URI,
        });
        if (videoReply && videoReply.videoDataUri) {
            response.videoDataUri = videoReply.videoDataUri;
        } else {
            console.warn('Video generation failed, falling back to text/audio.');
        }
    }
    
    if ((shouldGenerateVoice || aiTextResponse.length > 10) && !response.videoDataUri) {
      const voiceMessage = await generatePersonalizedVoiceMessage({
        messageText: aiTextResponse,
        characterStyle: (characterMeta.voiceStyle as CharacterName) || (characterMeta.name as CharacterName) || 'Riya', 
      });
      if (voiceMessage && voiceMessage.audioDataUri) {
        response.audioDataUri = voiceMessage.audioDataUri;
      } else {
        console.warn('Voice generation failed, falling back to text.');
      }
    }
    
    return response;

  } catch (error) {
    console.error('Error handling user message in AI action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the AI.';
    return { error: errorMessage };
  }
}
