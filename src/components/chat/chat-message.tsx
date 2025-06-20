
// src/components/chat/chat-message.tsx
'use client';

import type { ChatMessageUI, VirtualGift } from '@/lib/types'; 
import { cn, getInitials } from '@/lib/utils'; 
import { Bot, User, AlertTriangle, Loader2, Gift as GiftIconLucide, Sparkles } from 'lucide-react'; 
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import * as Icons from 'lucide-react'; 
import ReactMarkdown from 'react-markdown';

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
          hour12: true,
        })
      );
    }
  }, [message.timestamp]);

  const getBubbleStyle = () => {
    let baseClasses = 'p-3 md:p-3.5 rounded-2xl shadow-md break-words text-sm md:text-base transition-all duration-300 ease-in-out max-w-full'; // Ensure max-width for responsiveness
    
    if (isUser) {
      if (message.type === 'gift_sent') {
        return `${baseClasses} bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 text-black rounded-br-lg shadow-lg border border-amber-500/30`; 
      }
      return `${baseClasses} bg-gradient-to-br from-primary via-rose-500 to-pink-600 text-primary-foreground rounded-br-lg group-hover:shadow-lg`;
    }
    
    if (characterBubbleStyle === 'bubble-priya') { // Example for specific character style
        return `${baseClasses} bg-gradient-to-tr from-teal-400 via-cyan-500 to-sky-500 text-white rounded-bl-lg shadow-glow-accent`;
    }
    // Default AI bubble: subtle gradient on card background or solid card color
    return `${baseClasses} bg-card text-card-foreground rounded-bl-lg shadow-soft-lg border border-border/60 group-hover:border-accent/60`;
  };

  const renderGiftIcon = (gift: VirtualGift) => {
    const IconComponent = Icons[gift.iconName] as React.ElementType;
    return IconComponent ? <IconComponent className="h-6 w-6 inline-block mr-2 text-amber-600 flex-shrink-0" /> : <GiftIconLucide className="h-6 w-6 inline-block mr-2 text-amber-600 flex-shrink-0"/>;
  };

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <ReactMarkdown
            components={{
              p: ({node, ...props}) => <p className="mb-0 last:mb-0 leading-relaxed" {...props} />, 
            }}
          >
            {message.content}
          </ReactMarkdown>
        );
      case 'gift_sent':
        return (
            <div className="flex items-center gap-2.5">
                {message.sentGift && renderGiftIcon(message.sentGift)}
                <div className="flex-grow">
                    <p className="font-semibold">
                        You sent {message.sentGift?.name || 'a gift'}!
                    </p>
                    {message.sentGift && message.content.includes("You also said:") && (
                        <p className="text-sm opacity-80 mt-1 italic">
                           "{message.content.split('You also said: "')[1]?.slice(0,-1)}"
                        </p>
                    )}
                </div>
            </div>
        );
      case 'audio':
        return (
          <div className="space-y-2">
            {message.content && message.content !== "[Playing audio...]" && <p className="text-sm italic opacity-80 mb-1">{message.content}</p> }
            {message.audioSrc && (
              <audio controls src={message.audioSrc} className="w-full max-w-xs h-10 rounded-lg shadow-inner bg-black/10">
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        );
      case 'video': 
        return (
           <div className="space-y-2">
            {message.content && message.content !== "[Playing video...]" && <p className="text-sm italic opacity-80 mb-1">{message.content}</p>}
            {message.videoSrc ? (
              <video controls src={message.videoSrc} className="w-full max-w-xs rounded-xl aspect-video shadow-lg bg-black/20" muted={false} playsInline>
                Your browser does not support the video tag.
              </video>
            ) : (
              message.content.startsWith('data:image') ? 
              <Image src={message.content} alt="User uploaded image" width={240} height={180} className="rounded-xl object-cover shadow-lg" />
              : null 
            )}
          </div>
        );
      case 'loading':
        return (
          <div className="flex items-center space-x-2.5 text-current opacity-80">
            <Sparkles className="h-5 w-5 animate-pulse-spinner text-primary" />
            <span className="text-sm italic">{message.content || 'Soch rahi hoon...'}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2.5 text-destructive-foreground bg-destructive/90 px-3.5 py-2.5 rounded-lg shadow-md">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">{message.content || 'Oops, kuch gadbad ho gayi!'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex items-end space-x-2 group animate-fade-in w-fit', // Changed max-w to w-fit for natural sizing
        isUser ? 'justify-end self-end ml-auto pl-[10%] sm:pl-[15%]' : 'justify-start self-start mr-auto pr-[10%] sm:pr-[15%]' // Added padding to opposite side to prevent full width
      )}
    >
      {!isUser && (
        <Avatar className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md self-end mb-1 border-2 border-accent/30 group-hover:border-accent transition-all">
            <AvatarImage src={aiAvatarUrl} alt={message.characterName || 'AI'} />
            <AvatarFallback className="bg-accent/20 text-accent text-sm font-semibold">
              {message.characterName ? getInitials(message.characterName) : <Bot size={18}/>}
            </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          getBubbleStyle()
        )}
      >
        {renderContent()}
        {clientFormattedTimestamp && message.type !== 'loading' && message.type !== 'error' && (
          <p className={cn(
              "text-xs mt-1.5 text-right opacity-70", 
              isUser ? "text-primary-foreground/80" : "text-muted-foreground/90"
          )}>
            {clientFormattedTimestamp}
          </p>
        )}
      </div>
       {isUser && ( 
         <Avatar className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md self-end mb-1 border-2 border-secondary/30 group-hover:border-secondary transition-all">
            <AvatarImage src={userProfile?.avatarUrl || user?.photoURL || undefined} />
            <AvatarFallback className="bg-secondary/20 text-secondary-foreground text-sm font-semibold">
              {userDisplayName ? getInitials(userDisplayName) : <User size={18}/>}
            </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
