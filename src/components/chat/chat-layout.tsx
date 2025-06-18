// src/components/chat/chat-layout.tsx
'use client';

import type { ChatMessageUI, CharacterName } from '@/lib/types';
import { ChatAvatar } from './chat-avatar';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import React from 'react';

interface ChatLayoutProps {
  messages: ChatMessageUI[];
  onSendMessage: (message: string, type?: 'text' | 'audio_request' | 'video_request') => void;
  isLoading: boolean;
  currentCharacterName: CharacterName;
  currentCharacterAvatar: string; // URL for static avatar
  currentVideoMessageSrc?: string; // For AI video replies shown in avatar
}

export function ChatLayout({
  messages,
  onSendMessage,
  isLoading,
  currentCharacterName,
  currentCharacterAvatar,
  currentVideoMessageSrc,
}: ChatLayoutProps) {
  
  // Find the latest AI video message to pass to ChatAvatar if not explicitly provided
  // The videoSrc for an AI message is now part of ChatMessageUI if it's a video type.
  const latestAiVideoSrcForAvatar = currentVideoMessageSrc; // The page can explicitly set this for avatar


  return (
    <div className="flex flex-col md:flex-row flex-grow overflow-hidden h-full">
      <ChatAvatar 
        characterName={currentCharacterName}
        staticAvatarSrc={currentCharacterAvatar} // Pass the character's actual avatar
        videoSrc={latestAiVideoSrcForAvatar} // This will make the avatar play the video
      />
      <div className="flex flex-col flex-grow bg-background/50 backdrop-blur-sm md:border-l border-border h-full">
        <ChatMessages messages={messages} />
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} characterName={currentCharacterName} />
      </div>
    </div>
  );
}
