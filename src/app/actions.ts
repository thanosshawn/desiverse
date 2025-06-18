// src/app/actions.ts
'use server';

import { personalizeDailyMessage } from '@/ai/flows/personalize-daily-message';
import { generatePersonalizedVoiceMessage } from '@/ai/flows/generate-personalized-voice-message';
import { generateVideoReply } from '@/ai/flows/generate-video-replies';
import type { CharacterMetadata } from '@/lib/types'; 
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';

interface AIActionInputMessage { 
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
  chatHistory: AIActionInputMessage[], 
  characterMeta: CharacterMetadata, 
  userId: string, 
  chatId: string   
): Promise<AIResponse> {
  try {
    const previousMessagesText = chatHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : characterMeta.name}: ${msg.content}`)
      .join('\n');

    const userPreferencesForAI = `User is interacting with ${characterMeta.name}.
    Character's persona: ${characterMeta.basePrompt}.
    Style tags: ${characterMeta.styleTags.join(', ')}.
    Default voice tone: ${characterMeta.defaultVoiceTone}.
    They enjoy flirty, emotional, Bollywood-style dialogues in Hinglish.
    Current user input: ${userInput}`;

    const personalizedMessage = await personalizeDailyMessage({
      userName: 'User', 
      userPreferences: userPreferencesForAI, 
      previousMessages: previousMessagesText,
      basePrompt: characterMeta.basePrompt, 
      styleTags: characterMeta.styleTags,   
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

    if (shouldGenerateVideo || (aiTextResponse.length > 150 && Math.random() < 0.2)) { 
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
        // Use a valid enum value for characterStyle.
        // 'Riya' is one of the allowed values: "Riya", "Pooja", "Meera", "Anjali".
        // characterMeta.defaultVoiceTone is a description, not a direct key for TTS.
        characterStyle: 'Riya', 
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

