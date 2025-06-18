// src/components/chat/chat-message.tsx
'use client';

import type { ChatMessageUI, VirtualGift } from '@/lib/types'; // Added VirtualGift
import { cn } from '@/lib/utils';
import { Bot, User, AlertTriangle, Loader2, Gift as GiftIconLucide } from 'lucide-react'; // Added GiftIconLucide
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import * as Icons from 'lucide-react'; // Import all for dynamic gift icons

interface ChatMessageProps {
  message: ChatMessageUI;
  characterBubbleStyle?: string;
  aiAvatarUrl: string; 
}

export function ChatMessage({ message, characterBubbleStyle, aiAvatarUrl }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  
  const [clientFormattedTimestamp, setClientFormattedTimestamp] = useState<string | null>(null);
  
  useEffect(() => {
    if (message.timestamp) {
      setClientFormattedTimestamp(
        new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [message.timestamp]);

  const getBubbleStyle = () => {
    if (isUser) {
      if (message.type === 'gift_sent') {
        return 'bg-amber-400 dark:bg-amber-500 text-black dark:text-white rounded-br-none shadow-lg'; // Special style for sent gifts
      }
      return 'bg-primary text-primary-foreground rounded-br-none';
    }
    // For AI messages, including gift reactions (which are just text from AI)
    if (characterBubbleStyle && characterBubbleStyle.includes('pink')) {
        return 'bg-gradient-to-br from-pink-500 to-rose-400 text-white rounded-bl-none shadow-md';
    }
    return 'bg-card text-card-foreground rounded-bl-none shadow-md';
  };

  const renderGiftIcon = (gift: VirtualGift) => {
    const IconComponent = Icons[gift.iconName] as React.ElementType;
    return IconComponent ? <IconComponent className="h-4 w-4 inline-block mr-1.5 text-current" /> : <GiftIconLucide className="h-4 w-4 inline-block mr-1.5 text-current"/>;
  };

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <p className="whitespace-pre-wrap">{message.content}</p>;
      case 'gift_sent':
        return (
            <div className="flex items-center">
                {message.sentGift && renderGiftIcon(message.sentGift)}
                <p className="whitespace-pre-wrap italic">{message.content}</p>
            </div>
        );
      // gift_received is essentially a text message from AI, styled as normal AI message
      case 'gift_received': 
        return <p className="whitespace-pre-wrap">{message.content}</p>;
      case 'audio':
        return (
          <div className="space-y-1.5">
            {message.content && message.content !== "[Playing audio...]" && <p className="text-sm italic opacity-90">{message.content}</p> }
            {message.audioSrc && (
              <audio controls src={message.audioSrc} className="w-full max-w-xs h-10 rounded-lg">
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        );
      case 'video': 
        return (
           <div className="space-y-1.5">
            {message.content && message.content !== "[Playing video...]" && <p className="text-sm italic opacity-90">{message.content}</p>}
            {message.videoSrc ? (
              <video controls src={message.videoSrc} className="w-full max-w-xs rounded-xl aspect-video shadow-lg" muted={false} playsInline>
                Your browser does not support the video tag.
              </video>
            ) : (
              message.content.startsWith('data:image') ? 
              <Image src={message.content} alt="User uploaded image" width={200} height={150} className="rounded-xl object-cover shadow-lg" />
              : null 
            )}
          </div>
        );
      case 'loading':
        return (
          <div className="flex items-center space-x-2 text-current opacity-80">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{message.content || 'Thinking...'}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-destructive-foreground bg-destructive/80 px-3 py-2 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">{message.content || 'An error occurred.'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex items-end space-x-2 group animate-slide-in-from-bottom max-w-[85%] sm:max-w-[75%] md:max-w-[70%]',
        isUser ? 'justify-end self-end' : 'justify-start self-start'
      )}
    >
      {!isUser && (
        <Avatar className="flex-shrink-0 w-8 h-8 rounded-full shadow-sm self-end mb-1">
            <AvatarImage src={aiAvatarUrl} alt={message.characterName || 'AI'} />
            <AvatarFallback className="bg-pink-500/90 text-white text-xs">
              {message.characterName ? message.characterName.substring(0,1).toUpperCase() : <Bot size={16}/>}
            </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'p-3 rounded-2xl shadow-lg break-words text-sm md:text-base',
          getBubbleStyle()
        )}
      >
        {renderContent()}
        {clientFormattedTimestamp && message.type !== 'loading' && message.type !== 'error' && (
          <p className={cn("text-xs mt-1.5 text-right opacity-70", isUser ? "text-current/70" : "text-current/70")}>
            {clientFormattedTimestamp}
          </p>
        )}
      </div>
       {isUser && message.type !== 'gift_sent' && ( // Don't show user avatar for gift_sent messages, as gift bubble is distinct
         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-sm self-end mb-1">
          <User size={18} />
        </div>
      )}
    </div>
  );
}
