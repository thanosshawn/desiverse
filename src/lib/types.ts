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
  // receivedGift?: VirtualGift; // If type is 'gift_received', AI's message is the reaction
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
  sentGiftId?: string; // ID of the gift if messageType is 'gift_sent'
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
