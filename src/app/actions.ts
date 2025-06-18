'use server';

import { personalizeDailyMessage } from '@/ai/flows/personalize-daily-message';
import { generatePersonalizedVoiceMessage } from '@/ai/flows/generate-personalized-voice-message';
import { generateVideoReply } from '@/ai/flows/generate-video-replies';
import type { ChatMessage, CharacterName } from '@/lib/types';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';

interface AIResponse {
  text?: string;
  audioDataUri?: string;
  videoDataUri?: string;
  error?: string;
}

// Simple static avatar data URI for video generation
// A 1x1 transparent pixel. Replace with a real avatar if available.
const STATIC_AVATAR_DATA_URI = DEFAULT_AVATAR_DATA_URI;

export async function handleUserMessageAction(
  userInput: string,
  chatHistory: ChatMessage[],
  character: CharacterName = 'Riya', // Default character
  requestType?: 'text' | 'audio_request' | 'video_request'
): Promise<AIResponse> {
  try {
    // 1. Get text response
    const previousMessagesText = chatHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : character}: ${msg.type === 'text' ? msg.content : `[${msg.type} message]`}`)
      .join('\n');

    const personalizedMessage = await personalizeDailyMessage({
      userName: 'User', // Can be dynamic in a real app
      userPreferences: `User is interacting with ${character}. They enjoy flirty, emotional, Bollywood-style dialogues.`,
      previousMessages: previousMessagesText + `\nUser: ${userInput}`,
    });

    if (!personalizedMessage || !personalizedMessage.message) {
      return { error: 'Failed to get a text response from AI.' };
    }
    
    const aiTextResponse = personalizedMessage.message;
    let response: AIResponse = { text: aiTextResponse };

    // 2. Determine if voice or video is needed based on requestType or keywords
    const lowerInput = userInput.toLowerCase();
    let shouldGenerateVoice = requestType === 'audio_request';
    let shouldGenerateVideo = requestType === 'video_request';

    // Simple keyword-based trigger if no explicit request type
    if (!requestType) {
      if (lowerInput.includes('voice') || lowerInput.includes('sing') || lowerInput.includes('awaaz')) {
        shouldGenerateVoice = true;
      } else if (lowerInput.includes('video') || lowerInput.includes('dekhna') || lowerInput.includes('show me')) {
        shouldGenerateVideo = true;
      }
    }
    
    // Prioritize video if both flags are true somehow
    if (shouldGenerateVideo) {
        const videoReply = await generateVideoReply({
            message: aiTextResponse,
            avatarDataUri: STATIC_AVATAR_DATA_URI,
        });
        if (videoReply && videoReply.videoDataUri) {
            response.videoDataUri = videoReply.videoDataUri;
            // If video is generated, text might be redundant or could be a caption.
            // For now, let's keep the text response as the primary content for the message object.
            // The video will be played by the avatar.
        } else {
            console.warn('Video generation failed, falling back to text/audio.');
            // Fallback to voice if video fails and voice was also an option or default
            if(shouldGenerateVoice) {
                 // proceed to voice generation
            } else {
                 // just return text
                 return response;
            }
        }
    }
    
    // Generate voice if requested (and video was not, or failed and voice is a fallback)
    if (shouldGenerateVoice && !response.videoDataUri) {
      const voiceMessage = await generatePersonalizedVoiceMessage({
        messageText: aiTextResponse,
        characterStyle: character,
      });
      if (voiceMessage && voiceMessage.audioDataUri) {
        response.audioDataUri = voiceMessage.audioDataUri;
      } else {
        console.warn('Voice generation failed, falling back to text.');
      }
    }
    
    return response;

  } catch (error) {
    console.error('Error handling user message:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the AI.';
    return { error: errorMessage };
  }
}
