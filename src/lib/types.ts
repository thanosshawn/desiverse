// src/lib/types.ts
import type { Timestamp } from 'firebase/firestore';

export type CharacterName = 'Riya' | 'Pooja' | 'Meera' | 'Anjali' | string;

// For UI display, might be different from Firestore MessageDocument
export interface ChatMessageUI {
  id: string; // Can be Firestore doc ID or client-generated for optimistic updates
  sender: 'user' | 'ai';
  type: 'text' | 'audio' | 'video' | 'loading' | 'error'; // UI states
  content: string; // For text, loading message, or error message
  characterName?: CharacterName; // Could be AI character this message is from/to
  timestamp: Date; // Converted from Firestore Timestamp for UI
  audioSrc?: string; // data URI for audio playback
  videoSrc?: string; // data URI for video playback
  firestoreDocId?: string; // To link back to Firestore document if needed
}


export interface UserProfile {
  uid: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  joinedAt: Timestamp;
  lastActive: Timestamp;
  subscriptionTier: 'free' | 'premium' | 'spicy';
}

export interface CharacterMetadata {
  id: string; // characterId, e.g., "priya", "rahul"
  name: CharacterName;
  tagline: string;
  avatarUrl: string;
  description: string;
  prompt: string; // Base prompt for Gemini
  voiceStyle?: string; // For TTS, e.g., ElevenLabs voice ID
  dataAiHint?: string; // For placeholder image generation
}

export interface ChatSession {
  id: string; // Firestore document ID for this chat session
  userId: string;
  characterId: string; // From CharacterMetadata
  characterName: CharacterName; // Denormalized
  characterAvatarUrl: string; // Denormalized
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageText?: string;
  lastMessageTimestamp?: Timestamp;
  title?: string; // Optional: e.g., "Late night with Riya"
  isFavorite?: boolean;
}

export interface MessageDocument {
  // id will be Firestore document ID
  chatId: string; // Belongs to which ChatSession
  sender: 'user' | 'ai';
  text: string; // Hinglish message content
  timestamp: Timestamp; // Firestore server timestamp
  audioUrl?: string; // URL to audio file in Firebase Storage (for TTS)
  videoUrl?: string; // URL to video file (future)
  messageType: 'text' | 'audio' | 'video'; // Type of persisted message
  // 'loading' and 'error' are typically transient UI states, not stored long-term
}

export const DEFAULT_AVATAR_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
