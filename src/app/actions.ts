
// src/app/actions.ts
'use server';

import { personalizeDailyMessage } from '@/ai/flows/personalize-daily-message';
import type { CharacterMetadata } from '@/lib/types'; 
import type { MessageDocument, UserProfile } from '@/lib/types'; // Added UserProfile
import { updateUserProfile } from '@/lib/firebase/rtdb'; // Added for subscription

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
  chatId: string, 
  userDisplayName: string, 
  giftReactionPrompt?: string 
): Promise<AIResponse> {
  try {
    const formattedPreviousMessages = chatHistory
      .map(msg => ({
        sender: msg.sender === 'user' ? userDisplayName : characterMeta.name,
        content: msg.content,
      }))
      .slice(-10); 

    let userPreferencesForAI = `User is interacting with ${characterMeta.name}. User's name is ${userDisplayName}.
    Character's persona: ${characterMeta.basePrompt}.
    Style tags: ${characterMeta.styleTags.join(', ')}.
    Default voice tone: ${characterMeta.defaultVoiceTone}.
    They enjoy flirty, emotional, Bollywood-style dialogues in Hinglish.`;

    if (giftReactionPrompt) {
      userPreferencesForAI = `${giftReactionPrompt}\n\nAfter reacting to the gift, consider the following user input (if any) from ${userDisplayName}: ${userInput}\n\n${userPreferencesForAI}`;
    } else {
      userPreferencesForAI = `${userPreferencesForAI}\n\nCurrent user input from ${userDisplayName}: ${userInput}`;
    }
    
    const personalizedMessage = await personalizeDailyMessage({
      userName: userDisplayName, 
      userPreferences: userPreferencesForAI, 
      previousMessages: formattedPreviousMessages, 
      basePrompt: characterMeta.basePrompt, 
      styleTags: characterMeta.styleTags,   
    });

    if (!personalizedMessage || !personalizedMessage.message) {
      return { error: 'Failed to get a text response from AI.' };
    }
    
    const aiTextResponse = personalizedMessage.message;
    let response: AIResponse = { text: aiTextResponse };
    
    return response;

  } catch (error) {
    console.error('Error handling user message in AI action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with the AI.';
    return { error: errorMessage };
  }
}


export async function processAndAddAiResponse(
  userId: string,
  characterId: string,
  aiResponse: AIResponse,
  characterMeta: CharacterMetadata 
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (aiResponse.error || !aiResponse.text) {
    const errorMessage = aiResponse.error || "AI response error.";
    console.error("AI Response Error:", errorMessage);
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
    const { addMessageToChat } = await import('@/lib/firebase/rtdb');
    const messageId = await addMessageToChat(userId, characterId, aiMessageData);
    return { success: true, messageId };
  } catch (error) {
    console.error('Error adding AI message to chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save AI message.';
    return { success: false, error: errorMessage };
  }
}

// --- Subscription Action ---
export interface SubscriptionUpgradeState {
  success: boolean;
  message: string;
  newTier?: UserProfile['subscriptionTier'];
}

export async function processSubscriptionUpgrade(
  userId: string | undefined // Make userId optional to handle unauthenticated state gracefully
): Promise<SubscriptionUpgradeState> {
  if (!userId) {
    return {
      success: false,
      message: "User not authenticated. Please log in to upgrade.",
    };
  }

  try {
    // In a real app, this is where you'd integrate with Stripe, PayPal, etc.
    // For this simulation, we'll assume payment is successful.
    console.log(`Simulating successful payment for user: ${userId}`);

    // Update user's profile in Firebase RTDB
    await updateUserProfile(userId, { subscriptionTier: 'premium' });
    
    return {
      success: true,
      message: "🎉 Congratulations! You've successfully upgraded to DesiBae Premium! All features are now unlocked.",
      newTier: 'premium',
    };
  } catch (error) {
    console.error('Error processing subscription upgrade for user:', userId, error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during the upgrade.';
    return {
      success: false,
      message: `Upgrade failed: ${errorMessage}. Please try again or contact support.`,
    };
  }
}
