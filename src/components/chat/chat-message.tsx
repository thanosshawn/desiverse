// src/components/chat/chat-message.tsx
'use client';

import type { ChatMessageUI } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bot, User, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image'; // For displaying video thumbnails or static image messages

interface ChatMessageProps {
  message: ChatMessageUI;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  
  const formattedTimestamp = useMemo(() => {
    if (typeof window === 'undefined') return null; // Ensure client-side only for initial render
    if (message.timestamp) {
      return new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return null;
  }, [message.timestamp]);

  // State to manage client-side rendering of timestamp after hydration
  const [clientFormattedTimestamp, setClientFormattedTimestamp] = useState<string | null>(null);
  useEffect(() => {
    setClientFormattedTimestamp(formattedTimestamp);
  }, [formattedTimestamp]);


  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <p className="whitespace-pre-wrap">{message.content}</p>;
      case 'audio':
        return (
          <div>
            {message.content && message.content !== "[Playing audio...]" && <p className="mb-2 text-sm italic">{message.content}</p> }
            {message.audioSrc && (
              <audio controls src={message.audioSrc} className="w-full max-w-xs h-10"> {/* Adjusted height */}
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        );
      case 'video': 
        // Videos for AI are played by ChatAvatar. This is for inline display if needed, or user videos.
        return (
           <div>
            {message.content && message.content !== "[Playing video...]" && <p className="mb-2 text-sm italic">{message.content}</p>}
            {message.videoSrc ? (
              <video controls src={message.videoSrc} className="w-full max-w-xs rounded-md aspect-video" muted={false} playsInline>
                Your browser does not support the video tag.
              </video>
            ) : (
              message.content.startsWith('data:image') ? // Simple check if content itself is an image data URI
              <Image src={message.content} alt="User uploaded image" width={200} height={150} className="rounded-md object-cover" />
              : null // Or some placeholder
            )}
          </div>
        );
      case 'loading':
        return (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{message.content || 'Thinking...'}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{message.content || 'An error occurred.'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex items-end space-x-2 group animate-in fade-in-50 slide-in-from-bottom-5 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          {/* TODO: Could show AI character avatar here if needed, or keep generic Bot */}
          <Bot size={20} />
        </div>
      )}
      <div
        className={cn(
          'max-w-[70%] p-3 rounded-xl shadow-md break-words',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-card-foreground rounded-bl-none'
        )}
      >
        {renderContent()}
        {clientFormattedTimestamp && (
          <p className={cn("text-xs mt-1 text-right", isUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
            {clientFormattedTimestamp}
          </p>
        )}
      </div>
      {isUser && (
         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
          <User size={20} />
        </div>
      )}
    </div>
  );
}
