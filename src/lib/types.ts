export type CharacterName = 'Riya' | 'Pooja' | 'Meera' | 'Anjali';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  type: 'text' | 'audio' | 'video' | 'loading' | 'error';
  content: string; // For text, URI for audio/video, or error message
  character?: CharacterName; 
  timestamp: Date;
  audioSrc?: string; // data URI for audio
  videoSrc?: string; // data URI for video
}

export const DEFAULT_AVATAR_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // 1x1 red pixel as placeholder
