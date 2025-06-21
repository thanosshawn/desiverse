
// src/components/chat/chat-message.tsx
'use client';

import type { ChatMessageUI, VirtualGift } from '@/lib/types'; 
import { cn, getInitials } from '@/lib/utils'; 
import { Bot, User, AlertTriangle, Sparkles, Share2 } from 'lucide-react'; 
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import * as Icons from 'lucide-react'; 
import ReactMarkdown from 'react-markdown';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageUI;
  characterBubbleStyle?: string; 
  aiAvatarUrl: string; 
  userDisplayName?: string; 
  userProfileAvatarUrl?: string | null;
  userFirebaseAuthAvatarUrl?: string | null;
}

const ChatMessageComponent = ({ 
  message, 
  characterBubbleStyle, 
  aiAvatarUrl, 
  userDisplayName,
  userProfileAvatarUrl,
  userFirebaseAuthAvatarUrl
}: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  const { toast } = useToast();
  
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
  
  const handleShare = async () => {
    const shareData = {
      title: `A message from ${message.characterName || 'my DesiBae'}!`,
      text: `My DesiBae said: "${message.content}"\n\nChat with your own AI Bae!`,
      url: window.location.origin,
    };
    try {
      // Try Web Share API first if it exists
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // This will be caught by the catch block and fall back to clipboard
        throw new Error("navigator.share is not supported.");
      }
    } catch (error) {
      console.warn("Web Share API failed, falling back to clipboard:", error);
      // Fallback to clipboard for any error (permission denied, cancellation, not supported)
      try {
        await navigator.clipboard.writeText(shareData.text);
        toast({ title: "Copied to Clipboard!", description: "Sharing isn't available, so we copied the message for you." });
      } catch (copyError) {
        console.error("Clipboard fallback failed:", copyError);
        toast({ title: "Sharing Failed", description: "Could not share or copy the message.", variant: 'destructive' });
      }
    }
  };


  const getBubbleStyle = () => {
    let baseClasses = 'p-3 md:p-3.5 rounded-2xl shadow-md break-words text-sm md:text-base transition-all duration-300 ease-in-out max-w-full'; 
    
    if (isUser) {
      if (message.type === 'gift_sent') {
        return `${baseClasses} bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 text-black rounded-tr-lg shadow-lg border border-amber-500/30`; 
      }
      return `${baseClasses} bg-gradient-to-br from-primary via-rose-500 to-pink-600 text-primary-foreground rounded-tr-lg group-hover:shadow-lg`;
    }
    
    // AI message style
    return `${baseClasses} bg-gradient-to-tr from-card via-muted/70 to-card text-card-foreground rounded-tl-lg shadow-soft-lg border border-border/60 group-hover:border-accent/60`;
  };

  const renderGiftIcon = (gift: VirtualGift) => {
    const IconComponent = Icons[gift.iconName] as React.ElementType;
    return IconComponent ? <IconComponent className="h-6 w-6 inline-block mr-2 text-amber-600 flex-shrink-0" /> : <Icons.Gift className="h-6 w-6 inline-block mr-2 text-amber-600 flex-shrink-0"/>;
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
        'flex items-end space-x-2.5 group animate-fade-in w-full', 
        isUser ? 'justify-end self-end ml-auto pl-[10%] sm:pl-[15%]' : 'justify-start self-start mr-auto pr-[10%] sm:pr-[15%]'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 self-end mb-1 flex items-center gap-1.5">
            <Avatar className="w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md border-2 border-accent/40 group-hover:border-accent transition-all">
                <AvatarImage src={aiAvatarUrl} alt={message.characterName || 'AI'} />
                <AvatarFallback className="bg-accent/20 text-accent text-sm font-semibold">
                  {message.characterName ? getInitials(message.characterName) : <Bot size={18}/>}
                </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
            </Button>
        </div>
      )}
      <div
        className={cn(
          getBubbleStyle(),
          "min-w-[60px]" // Ensure minimum width for very short messages
        )}
      >
        {renderContent()}
        {clientFormattedTimestamp && message.type !== 'loading' && message.type !== 'error' && (
          <p className={cn(
              "text-xs mt-2 text-right opacity-75", 
              isUser ? "text-primary-foreground/80" : "text-muted-foreground/90"
          )}>
            {clientFormattedTimestamp}
          </p>
        )}
      </div>
       {isUser && ( 
         <Avatar className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md self-end mb-1 border-2 border-secondary/40 group-hover:border-secondary transition-all">
            <AvatarImage src={userProfileAvatarUrl || userFirebaseAuthAvatarUrl || undefined} />
            <AvatarFallback className="bg-secondary/20 text-secondary-foreground text-sm font-semibold">
              {userDisplayName ? getInitials(userDisplayName) : <User size={18}/>}
            </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
export const ChatMessage = React.memo(ChatMessageComponent);
