// src/lib/types.ts
import { z } from 'zod';

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
  // New settings fields
  selectedTheme?: 'light' | 'dark' | 'pink' | 'purple' | 'bollywood'; // Example themes
  languagePreference?: 'hinglish' | 'english';
}

export interface CharacterMetadata {
  id: string; // characterId, e.g., "simran_001" (key in RTDB)
  name: CharacterName;
  description: string; // e.g., "A shy, poetic girl from Delhi who loves chai."
  personalitySnippet: string; // Short, catchy snippet for character card
  avatarUrl: string; // URL from Supabase (e.g., /avatars/simran.png)
  backgroundImageUrl?: string; // Optional URL from Supabase (e.g., /backgrounds/simran_bg.jpg)
  basePrompt: string; // Personality primer (e.g., "You are Simran, a sweet and poetic Indian girl…")
  styleTags: string[]; // e.g., ["romantic", "shy", "Bollywood fan", "Funny", "Bold"]
  defaultVoiceTone: string; // e.g., "soft playful Hinglish"
  createdAt: number; // RTDB timestamp (ms since epoch)
  dataAiHint?: string; // For placeholder image generation
  messageBubbleStyle?: string; // e.g. 'pink-gradient', 'default-blue' for custom message bubbles
  animatedEmojiResponse?: string; // URL to a short Lottie/GIF for card hover
  audioGreetingUrl?: string; // URL to a short audio clip for card hover
  isPremium?: boolean; // For future monetization
}

// Represents metadata for a chat session between a user and a character
// Stored at users/{userId}/userChats/{characterId}/metadata
export interface UserChatSessionMetadata {
  characterId: string; // Redundant, as it's the key, but useful for objects
  characterName: CharacterName;
  characterAvatarUrl: string; // This will be the Supabase URL
  createdAt: number; // RTDB timestamp
  updatedAt: number; // RTDB timestamp
  lastMessageText?: string;
  lastMessageTimestamp?: number;
  title?: string; // Optional: user can rename chat sessions
  isFavorite?: boolean; // For starring chats
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
  reactions?: Record<string, string[]>; // emoji: [userIds]
  referencedMessageId?: string; // For replies or context
}

export const DEFAULT_AVATAR_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';


// Shared Zod schema for Character Creation/Validation in Admin
export const characterCreationAdminFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be 50 characters or less.'),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500, 'Description must be 500 characters or less.'),
  personalitySnippet: z.string().min(5, 'Personality snippet must be at least 5 characters.').max(100, 'Personality snippet must be 100 characters or less.'),
  avatarUrl: z.string().url('Avatar URL must be a valid public URL from Supabase (or other provider).'),
  backgroundImageUrl: z.string().url('Background Image URL must be a valid public URL if provided.').optional().or(z.literal('')),
  basePrompt: z.string().min(20, 'Base prompt must be at least 20 characters to define personality.'),
  styleTags: z.string().min(1, 'Please enter at least one style tag (comma-separated e.g., Romantic, Funny).'),
  defaultVoiceTone: z.string().min(2, 'Default voice tone must be at least 2 characters (e.g., Sweet Hinglish).'),
  dataAiHint: z.string().max(30, 'AI hint for image generation should be short (max 2 words, e.g., "indian woman").').optional(),
  messageBubbleStyle: z.string().optional(), // Can be a CSS class or identifier
  animatedEmojiResponse: z.string().url("Animated Emoji Response URL must be a valid URL if provided (e.g., Lottie/GIF).").optional().or(z.literal('')),
  audioGreetingUrl: z.string().url("Audio Greeting URL must be a valid URL if provided.").optional().or(z.literal('')),
  isPremium: z.boolean().optional(), // This will be preprocessed from 'on'/true to boolean in the server action
});

export type CharacterCreationAdminFormValues = z.infer<typeof characterCreationAdminFormSchema>;


// For Admin Login (Prototype - INSECURE for storing plain text passwords)
export interface AdminCredentials {
  username: string;
  password?: string; // Password stored in plain text - VERY INSECURE
}

    