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
  userDisplayName?: string; // Added prop
}

export function ChatMessages({ messages, characterBubbleStyle, aiAvatarUrl, userDisplayName }: ChatMessagesProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      // Smooth scroll for new messages
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    // ScrollArea should take full available height and enable vertical scrolling
    <ScrollArea className="flex-grow" viewportRef={viewportRef}>
      {/* Padding around the messages container */}
      <div className="space-y-3 p-4 md:p-6">
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            characterBubbleStyle={characterBubbleStyle} 
            aiAvatarUrl={aiAvatarUrl} 
            userDisplayName={userDisplayName} // Pass down
          />
        ))}
      </div>
    </ScrollArea>
  );
}
