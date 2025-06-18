// src/lib/types.ts

export type CharacterName = 'Riya' | 'Pooja' | 'Meera' | 'Anjali' | string;

// For UI display
export interface ChatMessageUI {
  id: string; // RTDB key or client-generated for optimistic updates
  sender: 'user' | 'ai';
  type: 'text' | 'audio' | 'video' | 'loading' | 'error'; // UI states
  content: string; // For text, loading message, or error message
  characterName?: CharacterName;
  timestamp: Date; // Converted from RTDB timestamp (number) for UI
  audioSrc?: string; // data URI for audio playback
  videoSrc?: string; // data URI for video playback
  rtdbKey?: string; // To link back to RTDB object key
}

export interface UserProfile {
  uid: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  joinedAt: number; // RTDB timestamp (ms since epoch)
  lastActive: number; // RTDB timestamp (ms since epoch)
  subscriptionTier: 'free' | 'premium' | 'spicy';
}

export interface CharacterMetadata {
  id: string; // characterId, e.g., "priya", "rahul" (key in RTDB)
  name: CharacterName;
  tagline: string;
  avatarUrl: string;
  description: string;
  prompt: string; // Base prompt for Gemini
  voiceStyle?: string; // For TTS
  dataAiHint?: string; // For placeholder image generation
}

// Represents metadata for a chat session between a user and a character
// Stored at users/{userId}/userChats/{characterId}/metadata
export interface UserChatSessionMetadata {
  characterId: string; // Redundant, as it's the key, but useful for objects
  characterName: CharacterName;
  characterAvatarUrl: string;
  createdAt: number; // RTDB timestamp
  updatedAt: number; // RTDB timestamp
  lastMessageText?: string;
  lastMessageTimestamp?: number;
  title?: string;
  isFavorite?: boolean;
}

// Represents a message object as stored in RTDB
// Stored at users/{userId}/userChats/{characterId}/messages/{messageId}
export interface MessageDocument {
  // id (messageId) is the key of the object in RTDB
  sender: 'user' | 'ai';
  text: string;
  timestamp: number; // RTDB timestamp (ms since epoch) or ServerValue.TIMESTAMP
  audioUrl?: string;
  videoUrl?: string;
  messageType: 'text' | 'audio' | 'video';
}

export const DEFAULT_AVATAR_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';