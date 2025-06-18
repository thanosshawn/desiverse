'use client';

import type { ChatMessage as ChatMessageType, CharacterName } from '@/lib/types';
import { ChatAvatar } from './chat-avatar';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import React from 'react';

interface ChatLayoutProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string, type?: 'text' | 'audio_request' | 'video_request') => void;
  isLoading: boolean;
  currentCharacter: CharacterName;
  currentVideoMessageSrc?: string; // For AI video replies shown in avatar
}

export function ChatLayout({
  messages,
  onSendMessage,
  isLoading,
  currentCharacter,
  currentVideoMessageSrc,
}: ChatLayoutProps) {
  
  // Find the latest AI video message to pass to ChatAvatar if not explicitly provided
  const latestAiVideoSrc = currentVideoMessageSrc || messages.slice().reverse().find(msg => msg.sender === 'ai' && msg.type === 'video' && msg.videoSrc)?.videoSrc;


  return (
    <div className="flex flex-col md:flex-row flex-grow overflow-hidden h-full">
      <ChatAvatar 
        characterName={currentCharacter}
        videoSrc={latestAiVideoSrc} // This will make the avatar play the video
      />
      <div className="flex flex-col flex-grow bg-background/50 backdrop-blur-sm md:border-l border-border h-full">
        <ChatMessages messages={messages} />
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
