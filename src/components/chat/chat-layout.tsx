// src/components/chat/chat-layout.tsx
'use client';

import type { ChatMessageUI, CharacterName, UserProfile, VirtualGift } from '@/lib/types';
import { ChatAvatar } from './chat-avatar';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import React from 'react';

interface ChatLayoutProps {
  messages: ChatMessageUI[];
  onSendMessage: (message: string, type?: 'text' | 'audio_request' | 'video_request', gift?: VirtualGift) => void;
  isLoading: boolean;
  currentCharacterName: CharacterName;
  currentCharacterAvatar: string; 
  currentVideoMessageSrc?: string;
  characterMessageBubbleStyle?: string;
  characterIsPremium?: boolean;
  userSubscriptionTier?: UserProfile['subscriptionTier'];
  userDisplayName?: string; 
  userProfileAvatarUrl?: string | null; // Added
  userFirebaseAuthAvatarUrl?: string | null; // Added
}

export function ChatLayout({
  messages,
  onSendMessage,
  isLoading,
  currentCharacterName,
  currentCharacterAvatar,
  currentVideoMessageSrc,
  characterMessageBubbleStyle,
  characterIsPremium,
  userSubscriptionTier,
  userDisplayName, 
  userProfileAvatarUrl, // Added
  userFirebaseAuthAvatarUrl // Added
}: ChatLayoutProps) {
  
  const latestAiVideoSrcForAvatar = currentVideoMessageSrc;

  return (
    <div className="flex flex-col md:flex-row flex-grow overflow-hidden h-full">
      <div className="hidden md:flex md:w-[320px] lg:w-[360px] p-4 flex-col items-center justify-start border-r border-border/20 bg-card/60 backdrop-blur-sm sticky top-0 h-full overflow-y-auto shadow-lg">
        <ChatAvatar 
          characterName={currentCharacterName}
          staticAvatarSrc={currentCharacterAvatar}
          videoSrc={latestAiVideoSrcForAvatar}
          isLoadingAiResponse={isLoading} 
        />
      </div>
      
      <div className="flex flex-col flex-grow h-full overflow-hidden bg-transparent">
        <ChatMessages 
            messages={messages} 
            characterBubbleStyle={characterMessageBubbleStyle}
            aiAvatarUrl={currentCharacterAvatar} 
            userDisplayName={userDisplayName} 
            userProfileAvatarUrl={userProfileAvatarUrl} // Pass down
            userFirebaseAuthAvatarUrl={userFirebaseAuthAvatarUrl} // Pass down
        />
        <ChatInput 
            onSendMessage={onSendMessage} 
            isLoading={isLoading} 
            characterName={currentCharacterName}
            characterIsPremium={characterIsPremium}
            userSubscriptionTier={userSubscriptionTier}
        />
      </div>
    </div>
  );
}
