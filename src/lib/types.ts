
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
  selectedTheme?: 'light' | 'dark';
  languagePreference?: 'hinglish' | 'english';
}

export interface CharacterMetadata {
  id: string;
  name: CharacterName;
  description: string;
  personalitySnippet: string;
  avatarUrl: string;
  backgroundImageUrl?: string | null;
  basePrompt: string;
  styleTags: string[];
  defaultVoiceTone: string;
  createdAt: number;
  dataAiHint?: string;
  messageBubbleStyle?: string | null;
  animatedEmojiResponse?: string | null;
  audioGreetingUrl?: string | null;
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

export type PremiumFeature =
  | 'premium_character_chat'
  | 'premium_voice_message'
  | 'premium_gift';

export interface InteractiveStory {
  id: string;
  title: string;
  description: string;
  characterId: string;
  characterNameSnapshot: string;
  characterAvatarSnapshot: string;
  coverImageUrl?: string | null;
  tags: string[];
  initialSceneSummary: string;
  createdAt: number | object;
  updatedAt?: number | object;
}

export type InteractiveStoryAdminFormValues = Omit<InteractiveStory, 'id' | 'createdAt' | 'updatedAt' | 'characterNameSnapshot' | 'characterAvatarSnapshot' | 'tags'> & {
  tagsString: string;
};

export interface StoryTurnRecord {
  userChoice: string; // User's typed message OR the text of the choice they picked
  aiNarration: string;
  timestamp: number | object;
  offeredChoiceA?: string | null; // Text of choice A if offered
  offeredChoiceB?: string | null; // Text of choice B if offered
}

export interface UserStoryProgress {
  userId: string;
  storyId: string;
  currentTurnContext: {
    summaryOfCurrentSituation: string; // AI's current narration
    previousUserChoice: string; // User's typed message OR the text of the choice they picked
    choiceA?: string | null; // Current choice A text, if AI provided choices for this turn
    choiceB?: string | null; // Current choice B text, if AI provided choices for this turn
  };
  storyTitleSnapshot: string;
  characterIdSnapshot: string;
  lastPlayed: number | object;
  history?: StoryTurnRecord[];
}

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
    summaryOfCurrentSituation: z.string().describe("A summary of the current scene or situation in the story. This is typically the AI's narration from the previous turn, or the initial story summary if it's the first turn."),
    previousUserChoice: z.string().describe("The user's typed message or action in the previous turn to reach this situation. For the first turn, this could be a placeholder like 'Let's begin!'."),
  }),
});
export type StoryTurnInput = z.infer<typeof StoryTurnInputSchema>;

export const StoryTurnOutputSchema = z.object({
  narrationForThisTurn: z.string().describe("The AI character's story narration for the current turn, responding to the user's message/choice and continuing the story. Should be in Hinglish, immersive, romantic, and emotional, with emojis. This narration should also include any personal question for the user if applicable, integrated naturally within the text."),
  choiceA: z.string().optional().describe("Optional: A short, engaging text for choice A if the AI decides to offer choices. If not offering choices, omit this field or leave it empty/null."),
  choiceB: z.string().optional().describe("Optional: A short, engaging text for choice B if the AI decides to offer choices. If not offering choices, omit this field or leave it empty/null."),
});
export type StoryTurnOutput = z.infer<typeof StoryTurnOutputSchema>;

export const GenerateStoryIdeaInputSchema = z.object({
  characterName: z.string().describe("The name of the protagonist character."),
  characterPersonality: z.string().describe("A detailed description of the character's personality, backstory, and style tags."),
});
export type GenerateStoryIdeaInput = z.infer<typeof GenerateStoryIdeaInputSchema>;

export const GenerateStoryIdeaOutputSchema = z.object({
  title: z.string().describe("A catchy, evocative title for the story (5-10 words)."),
  description: z.string().describe("A short, intriguing summary of the story's plot (2-3 sentences)."),
  tagsString: z.string().describe("A comma-separated string of 3-5 relevant tags (e.g., Romance, Mystery, Heartbreak, Hidden Affair, College Romance)."),
  initialSceneSummary: z.string().describe("A detailed, immersive opening scene prompt to kick off the story. It should set the mood and present an initial situation or dilemma for the user to react to. This should be 2-4 sentences long."),
});
export type GenerateStoryIdeaOutput = z.infer<typeof GenerateStoryIdeaOutputSchema>;


// Group Chat Types
export interface GroupChatMetadata {
  id: string;
  title: string;
  description: string;
  characterId: string; // The primary AI host of the group
  characterNameSnapshot: string;
  characterAvatarSnapshot: string;
  coverImageUrl?: string | null;
  createdAt: number | object;
  updatedAt?: number | object;
  participantCount?: number;
  lastMessageText?: string;
  lastMessageTimestamp?: number | object;
}

export type GroupChatAdminFormValues = Omit<GroupChatMetadata, 'id' | 'createdAt' | 'updatedAt' | 'characterNameSnapshot' | 'characterAvatarSnapshot' | 'participantCount' | 'lastMessageText' | 'lastMessageTimestamp'>;
