'use client';

import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bot, User, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const [formattedTimestamp, setFormattedTimestamp] = useState<string | null>(null);

  useEffect(() => {
    if (message.timestamp) {
      setFormattedTimestamp(
        new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [message.timestamp]);

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <p className="whitespace-pre-wrap">{message.content}</p>;
      case 'audio':
        return (
          <div>
            <p className="mb-2 text-sm italic">{message.content}</p>
            {message.audioSrc && (
              <audio controls src={message.audioSrc} className="w-full max-w-xs">
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        );
      case 'video': // Video is handled by ChatAvatar for AI, this is for potential user video or alternative display
        return (
           <div>
            <p className="mb-2 text-sm italic">{message.content}</p>
            {message.videoSrc && (
              <video controls src={message.videoSrc} className="w-full max-w-xs rounded-md" muted={false} playsInline>
                Your browser does not support the video tag.
              </video>
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
        <p className={cn("text-xs mt-1", isUser ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
          {formattedTimestamp || '...'}
        </p>
      </div>
      {isUser && (
         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
          <User size={20} />
        </div>
      )}
    </div>
  );
}
