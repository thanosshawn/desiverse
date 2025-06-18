
// src/app/actions.ts
'use server';

import { personalizeDailyMessage } from '@/ai/flows/personalize-daily-message';
// import { generatePersonalizedVoiceMessage } from '@/ai/flows/generate-personalized-voice-message'; // Audio disabled
// import { generateVideoReply } from '@/ai/flows/generate-video-replies'; // Video disabled
import type { CharacterMetadata } from '@/lib/types'; 
// import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types'; // Not needed if video is disabled
import type { MessageDocument } from '@/lib/types';

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

    // const lowerInput = userInput.toLowerCase();
    // let shouldGenerateVoice = false; // Audio generation disabled
    // let shouldGenerateVideo = false; // Video generation disabled

    // if (lowerInput.includes('voice') || lowerInput.includes('sing') || lowerInput.includes('awaaz') || lowerInput.includes('gana')) {
    //     shouldGenerateVoice = true;
    // }
    // if (lowerInput.includes('video') || lowerInput.includes('dekhna') || lowerInput.includes('show me') || lowerInput.includes('dikhao')) {
    //     shouldGenerateVideo = true;
    // }

    // Video generation is disabled
    // if (shouldGenerateVideo || (aiTextResponse.length > 150 && Math.random() < 0.2)) { 
    //     const videoReply = await generateVideoReply({
    //         message: aiTextResponse,
    //         avatarDataUri: characterMeta.avatarUrl || DEFAULT_AVATAR_DATA_URI, 
    //     });
    //     if (videoReply && videoReply.videoDataUri) {
    //         response.videoDataUri = videoReply.videoDataUri;
    //     } else {
    //         console.warn('Video generation failed, falling back to text/audio.');
    //     }
    // }
    
    // Audio generation is disabled
    // if ((shouldGenerateVoice || aiTextResponse.length > 10) && !response.videoDataUri) {
    //   const voiceMessage = await generatePersonalizedVoiceMessage({
    //     messageText: aiTextResponse,
    //     characterStyle: 'Riya', 
    //   });
    //   if (voiceMessage && voiceMessage.audioDataUri) {
    //     response.audioDataUri = voiceMessage.audioDataUri;
    //   } else {
    //     console.warn('Voice generation failed, falling back to text.');
    //   }
    // }
    
    return response;

  } catch (error) {
    console.error('Error handling user message in AI action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the AI.';
    return { error: errorMessage };
  }
}


// This function is called by the client to process the AI response and add it to the chat
export async function processAndAddAiResponse(
  userId: string,
  characterId: string,
  aiResponse: AIResponse,
  characterMeta: CharacterMetadata // Added for context if needed for error messages
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (aiResponse.error || !aiResponse.text) {
    const errorMessage = aiResponse.error || "AI response error.";
    // Potentially log this error more formally or add an error message to the chat
    console.error("AI Response Error:", errorMessage);
    // Add an error message to the chat UI if desired (similar to how ChatPage might handle it)
    // This action doesn't directly update UI, but could return more info for UI to handle
    return { success: false, error: errorMessage };
  }

  const aiMessageData: Omit<MessageDocument, 'timestamp'> = {
    sender: 'ai',
    text: aiResponse.text,
    messageType: aiResponse.videoDataUri ? 'video' : aiResponse.audioDataUri ? 'audio' : 'text',
    audioUrl: aiResponse.audioDataUri || null, 
    videoUrl: aiResponse.videoDataUri || null, 
  };

  try {
    // Assuming addMessageToChat is imported from '@/lib/firebase/rtdb'
    // It needs to be adapted if this file is purely server-side and addMessageToChat is client-side or expects client context
    // For now, let's assume it's callable here or this logic is part of a broader server action context.
    // If addMessageToChat is from rtdb.ts, it's fine as it's server-compatible.
    const { addMessageToChat } = await import('@/lib/firebase/rtdb');
    const messageId = await addMessageToChat(userId, characterId, aiMessageData);
    return { success: true, messageId };
  } catch (error) {
    console.error('Error adding AI message to chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save AI message.';
    return { success: false, error: errorMessage };
  }
}

