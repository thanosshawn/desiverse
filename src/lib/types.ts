// src/lib/types.ts
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

export type CharacterName = 'Riya' | 'Pooja' | 'Meera' | 'Anjali' | string;

// Definition for a virtual gift
export interface VirtualGift {
  id: string;
  name: string;
  iconName: keyof typeof import('lucide-react'); // Name of the Lucide icon
  description: string; // Short description for the gift store
  aiReactionPrompt: string; // Specific prompt for AI to react to this gift
  isPremium: boolean; // Flag to indicate if the gift requires payment/subscription
  price?: number; // Optional price for future use
}

// For UI display
export interface ChatMessageUI {
  id: string; // RTDB key or client-generated for optimistic updates
  sender: 'user' | 'ai';
  type: 'text' | 'audio' | 'video' | 'loading' | 'error' | 'gift_sent' | 'gift_received'; // Added gift types
  content: string; // For text, loading message, error message, or AI's gift reaction
  characterName?: CharacterName;
  timestamp: Date; // Converted from RTDB timestamp (number) for UI
  audioSrc?: string; // data URI for audio playback
  videoSrc?: string; // data URI for video playback
  rtdbKey?: string; // To link back to RTDB object key
  sentGift?: VirtualGift; // If type is 'gift_sent', this holds the gift details
}

export interface UserProfile {
  uid: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  joinedAt: number; // RTDB timestamp (ms since epoch)
  lastActive: number; // RTDB timestamp (ms since epoch)
  subscriptionTier: 'free' | 'premium' | 'spicy';
  selectedTheme?: 'light' | 'dark' | 'pink' | 'purple' | 'bollywood';
  languagePreference?: 'hinglish' | 'english';
}

export interface CharacterMetadata {
  id: string;
  name: CharacterName;
  description: string;
  personalitySnippet: string;
  avatarUrl: string;
  backgroundImageUrl?: string;
  basePrompt: string;
  styleTags: string[];
  defaultVoiceTone: string;
  createdAt: number;
  dataAiHint?: string;
  messageBubbleStyle?: string;
  animatedEmojiResponse?: string;
  audioGreetingUrl?: string;
  isPremium?: boolean;
}

export interface UserChatSessionMetadata {
  characterId: string;
  characterName: CharacterName;
  characterAvatarUrl: string;
  createdAt: number;
  updatedAt: number;
  lastMessageText?: string;
  lastMessageTimestamp?: number;
  title?: string;
  isFavorite?: boolean;
}

export interface MessageDocument {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number | object; // Can be server timestamp placeholder
  audioUrl?: string | null;
  videoUrl?: string | null;
  messageType: 'text' | 'audio' | 'video' | 'gift_sent'; // Added 'gift_sent'
  sentGiftId?: string | null; // ID of the gift if messageType is 'gift_sent'
  reactions?: Record<string, string[]>;
  referencedMessageId?: string;
}

export const DEFAULT_AVATAR_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export type CharacterCreationAdminFormValues = {
  name: string;
  description: string;
  personalitySnippet: string;
  avatarUrl: string;
  backgroundImageUrl?: string;
  basePrompt: string;
  styleTags: string;
  defaultVoiceTone: string;
  dataAiHint?: string;
  messageBubbleStyle?: string;
  animatedEmojiResponse?: string;
  audioGreetingUrl?: string;
  isPremium?: boolean;
};

export interface AdminCredentials {
  username: string;
  password?: string;
}

export interface UserChatStreakData {
  currentStreak: number;
  lastChatDate: string;
}

export interface StreakUpdateResult {
  streak: number;
  status: 'first_ever' | 'continued' | 'maintained_same_day' | 'reset';
}

// For premium feature checks
export type PremiumFeature =
  | 'premium_character_chat'
  | 'premium_voice_message'
  | 'premium_gift';

// --- Interactive Story Types ---
export interface InteractiveStory {
  id: string;
  title: string;
  description: string;
  characterId: string; // ID of the CharacterMetadata to use
  characterNameSnapshot: string; // Snapshot of character name at time of story creation
  characterAvatarSnapshot: string; // Snapshot of character avatar
  coverImageUrl?: string | null;
  tags: string[];
  initialSceneSummary: string; // The first prompt/summary for the AI to start the story
  createdAt: number | object; // RTDB timestamp
  updatedAt?: number | object; // RTDB timestamp
}

export type InteractiveStoryAdminFormValues = Omit<InteractiveStory, 'id' | 'createdAt' | 'updatedAt' | 'characterNameSnapshot' | 'characterAvatarSnapshot'> & {
  tagsString: string; // For form input
};

export interface UserStoryProgress {
  userId: string;
  storyId: string;
  currentTurnContext: {
    summaryOfCurrentSituation: string; // This is the AI's last narration, becomes context for next turn
    previousUserChoice: string; // The choice the user just made
  };
  storyTitleSnapshot: string; // Snapshot of story title
  characterIdSnapshot: string; // Snapshot of character ID
  lastPlayed: number | object; // RTDB timestamp
  // Optional: history of choices if needed later
  // history: Array<{ sceneSummary: string; userChoice: string; aiNarration: string; timestamp: number }>;
}

// Genkit Flow for Story Turns
export const StoryTurnInputSchema = z.object({
  character: z.object({
    name: z.string().describe("The AI character's name."),
    styleTags: z.array(z.string()).describe("Personality style tags for the AI character."),
    defaultVoiceTone: z.string().describe("The default voice tone of the AI character."),
  }),
  story: z.object({
    title: z.string().describe("The title of the interactive story."),
  }),
  user: z.object({
    name: z.string().describe("The user's name."),
  }),
  currentTurn: z.object({
    summaryOfCurrentSituation: z.string().describe("A summary of the current scene or situation in the story. This is typically the AI's narration from the previous turn."),
    previousUserChoice: z.string().describe("The choice the user made in the previous turn to reach this situation."),
  }),
});
export type StoryTurnInput = z.infer<typeof StoryTurnInputSchema>;

export const StoryTurnOutputSchema = z.object({
  narrationForThisTurn: z.string().describe("The AI character's story narration for the current turn, continuing from the user's choice. Should be in Hinglish, immersive, romantic, and emotional, with emojis. This narration should also include any personal question for the user if applicable, integrated naturally within the text."),
  // personalQuestion field can be removed if integrated into narrationForThisTurn.
  // personalQuestion: z.string().optional().describe("An optional personal question or action point for the user related to the current story moment, if distinct from the main narration."),
  choiceA: z.string().describe("The text for the first choice (Option A) for the user to continue the story."),
  choiceB: z.string().describe("The text for the second choice (Option B) for the user to continue the story."),
});
export type StoryTurnOutput = z.infer<typeof StoryTurnOutputSchema>;
