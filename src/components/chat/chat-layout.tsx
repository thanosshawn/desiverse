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
  currentCharacterAvatar: string; 
  currentVideoMessageSrc?: string;
  characterMessageBubbleStyle?: string;
}

export function ChatLayout({
  messages,
  onSendMessage,
  isLoading,
  currentCharacterName,
  currentCharacterAvatar,
  currentVideoMessageSrc,
  characterMessageBubbleStyle,
}: ChatLayoutProps) {
  
  const latestAiVideoSrcForAvatar = currentVideoMessageSrc;

  return (
    // Ensure this div takes full height and allows children to manage their own scroll/layout
    <div className="flex flex-col md:flex-row flex-grow overflow-hidden h-full">
      {/* Avatar section for larger screens, hidden on mobile where avatar might be in header or messages */}
      <div className="hidden md:flex md:w-1/3 lg:w-1/4 p-4 flex-col items-center justify-start border-r border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 h-full overflow-y-auto">
        <ChatAvatar 
          characterName={currentCharacterName}
          staticAvatarSrc={currentCharacterAvatar}
          videoSrc={latestAiVideoSrcForAvatar}
          isLoadingAiResponse={isLoading} // Pass loading state
        />
        {/* You can add more character details or actions here for desktop */}
      </div>
      
      {/* Chat messages and input area take remaining space and handle their own scrolling */}
      <div className="flex flex-col flex-grow h-full overflow-hidden bg-transparent"> {/* Removed backdrop blur from here */}
        <ChatMessages messages={messages} characterBubbleStyle={characterMessageBubbleStyle} />
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} characterName={currentCharacterName} />
      </div>
    </div>
  );
}
