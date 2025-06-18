// src/app/actions.ts
'use server';

import { personalizeDailyMessage } from '@/ai/flows/personalize-daily-message';
import { generatePersonalizedVoiceMessage } from '@/ai/flows/generate-personalized-voice-message';
import { generateVideoReply } from '@/ai/flows/generate-video-replies';
import type { ChatMessageUI, CharacterMetadata, MessageDocument, CharacterName } from '@/lib/types';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';
// Removed: import { addMessageToChat, getCharacterMetadata } from '@/lib/firebase/firestore'; - Firestore operations will be handled client-side or in dedicated API routes if complex.
// Server actions should primarily orchestrate AI calls. Client handles Firestore writes for user messages and AI responses.

interface AIResponse {
  text?: string;
  audioDataUri?: string;
  videoDataUri?: string;
  error?: string;
}


export async function handleUserMessageAction(
  userInput: string,
  chatHistory: ChatMessageUI[], // Using ChatMessageUI from client, this might need adjustment for AI prompt
  characterMeta: CharacterMetadata,
  userId: string, // For potential user-specific AI logic if needed by Genkit flows
  chatId: string   // For context if Genkit flows need it
): Promise<AIResponse> {
  try {
    // 1. Get text response using Character's specific prompt
    const previousMessagesText = chatHistory
      .map(msg => `${msg.sender === 'user' ? 'User' : characterMeta.name}: ${msg.content}`) // msg.content is text
      .join('\n');

    // Using personalizeDailyMessage as a generic text generation flow
    // The prompt for this flow needs to be generic enough or adapted.
    // For DesiBae, the characterMeta.prompt should be the primary source for persona.
    // We'll use characterMeta.prompt inside personalizeDailyMessage (or a new flow)
    
    // Let's assume personalizeDailyMessage can take a direct system prompt or character definition
    // For now, we'll construct a dynamic userPreference string based on characterMeta.prompt
    const userPreferencesForAI = `User is interacting with ${characterMeta.name}. 
    Character's persona: ${characterMeta.prompt}. 
    They enjoy flirty, emotional, Bollywood-style dialogues in Hinglish.
    Current user input: ${userInput}`;


    const personalizedMessage = await personalizeDailyMessage({
      userName: 'User', // Can be dynamic if userProfile name is passed
      userPreferences: userPreferencesForAI,
      previousMessages: previousMessagesText, // Pass constructed history
    });

    if (!personalizedMessage || !personalizedMessage.message) {
      return { error: 'Failed to get a text response from AI.' };
    }
    
    const aiTextResponse = personalizedMessage.message;
    let response: AIResponse = { text: aiTextResponse };

    // 2. Determine if voice or video is needed based on keywords or explicit request (client can decide this and pass a flag)
    // For simplicity, this action will just generate based on AI response.
    // The client side can decide based on user input type if special request was made.
    // This action can be enhanced to take a 'requestType' parameter.

    // Let's assume for now that the decision to generate audio/video comes from the client (passed in requestType if available)
    // or determined by keywords in userInput as before.

    // Example: if userInput contained "send a video"
    const lowerInput = userInput.toLowerCase();
    let shouldGenerateVoice = false; // Default to no voice/video unless keywords
    let shouldGenerateVideo = false;

    if (lowerInput.includes('voice') || lowerInput.includes('sing') || lowerInput.includes('awaaz') || lowerInput.includes('gana')) {
        shouldGenerateVoice = true;
    }
    if (lowerInput.includes('video') || lowerInput.includes('dekhna') || lowerInput.includes('show me') || lowerInput.includes('dikhao')) {
        shouldGenerateVideo = true;
    }

    // Prioritize video if both flags are true somehow
    if (shouldGenerateVideo) {
        const videoReply = await generateVideoReply({
            message: aiTextResponse,
            avatarDataUri: characterMeta.avatarUrl || DEFAULT_AVATAR_DATA_URI, // Use character's avatar
        });
        if (videoReply && videoReply.videoDataUri) {
            response.videoDataUri = videoReply.videoDataUri;
        } else {
            console.warn('Video generation failed, falling back to text/audio.');
            if(shouldGenerateVoice) {
                 // proceed to voice generation below
            } else {
                 return response; // just return text
            }
        }
    }
    
    // Generate voice if requested (and video was not, or video failed and voice is a fallback)
    // Or if the AI's response itself suggests a voice message would be good.
    // For DesiBae, let's try to generate voice for most AI text responses unless it's very short or a video was made.
    if ((shouldGenerateVoice || aiTextResponse.length > 10) && !response.videoDataUri) { // Generate voice for longer messages
      const voiceMessage = await generatePersonalizedVoiceMessage({
        messageText: aiTextResponse,
        // Use character's voice style if defined, otherwise a default
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
    console.error('Error handling user message:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the AI.';
    return { error: errorMessage };
  }
}
