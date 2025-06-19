// src/components/chat/chat-message.tsx
'use client';

import type { ChatMessageUI, VirtualGift } from '@/lib/types'; 
import { cn, getInitials } from '@/lib/utils'; 
import { Bot, User, AlertTriangle, Loader2, Gift as GiftIconLucide } from 'lucide-react'; 
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import * as Icons from 'lucide-react'; 

interface ChatMessageProps {
  message: ChatMessageUI;
  characterBubbleStyle?: string;
  aiAvatarUrl: string; 
  userDisplayName?: string; 
}

export function ChatMessage({ message, characterBubbleStyle, aiAvatarUrl, userDisplayName }: ChatMessageProps) {
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
        // Distinct style for "gift sent" messages
        return 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-black rounded-br-none shadow-lg border border-amber-500/50'; 
      }
      return 'bg-primary text-primary-foreground rounded-br-none';
    }
    
    // AI message bubble styles
    if (characterBubbleStyle && characterBubbleStyle.includes('pink')) { // Example custom style
        return 'bg-gradient-to-br from-pink-500 to-rose-400 text-white rounded-bl-none shadow-md';
    }
    return 'bg-card text-card-foreground rounded-bl-none shadow-md'; // Default AI bubble
  };

  const renderGiftIcon = (gift: VirtualGift) => {
    const IconComponent = Icons[gift.iconName] as React.ElementType;
    return IconComponent ? <IconComponent className="h-5 w-5 inline-block mr-2 text-current flex-shrink-0" /> : <GiftIconLucide className="h-5 w-5 inline-block mr-2 text-current flex-shrink-0"/>;
  };

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <p className="whitespace-pre-wrap">{message.content}</p>;
      case 'gift_sent':
        // Display the gift icon, name, and any accompanying user text
        return (
            <div className="flex items-center gap-2">
                {message.sentGift && renderGiftIcon(message.sentGift)}
                <div className="flex-grow">
                    <p className="whitespace-pre-wrap italic font-medium">
                        Sent {message.sentGift?.name || 'a gift'}
                        {message.sentGift?.name && message.content.includes(message.sentGift.name) && message.content.split(message.sentGift.name)[1] ? 
                         `${message.content.split(message.sentGift.name)[1].split('.')[0]}.` : '.'}
                    </p>
                    {message.sentGift && message.content.includes("You also said:") && (
                        <p className="whitespace-pre-wrap text-sm opacity-90 mt-1">
                           "{message.content.split('You also said: "')[1]?.slice(0,-1)}"
                        </p>
                    )}
                </div>
            </div>
        );
      
      case 'gift_received': // Placeholder for AI receiving a gift, if needed for special UI
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
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {message.characterName ? getInitials(message.characterName) : <Bot size={16}/>}
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
       {isUser && ( 
         <Avatar className="flex-shrink-0 w-8 h-8 rounded-full shadow-sm self-end mb-1">
            {/* Future: if user can set avatar from UserProfile.avatarUrl */}
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {userDisplayName ? getInitials(userDisplayName) : <User size={16}/>}
            </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
