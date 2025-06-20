// src/components/chat/chat-messages.tsx
'use client';

import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import React, { useEffect, useRef } from 'react';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  characterBubbleStyle?: string;
  aiAvatarUrl: string; 
  userDisplayName?: string;
  userProfileAvatarUrl?: string | null; // Added
  userFirebaseAuthAvatarUrl?: string | null; // Added
}

export function ChatMessages({ 
  messages, 
  characterBubbleStyle, 
  aiAvatarUrl, 
  userDisplayName,
  userProfileAvatarUrl, // Added
  userFirebaseAuthAvatarUrl // Added
}: ChatMessagesProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-grow" viewportRef={viewportRef}>
      <div className="space-y-3 p-4 md:p-6">
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            characterBubbleStyle={characterBubbleStyle} 
            aiAvatarUrl={aiAvatarUrl} 
            userDisplayName={userDisplayName}
            userProfileAvatarUrl={userProfileAvatarUrl} // Pass down
            userFirebaseAuthAvatarUrl={userFirebaseAuthAvatarUrl} // Pass down
          />
        ))}
      </div>
    </ScrollArea>
  );
}
