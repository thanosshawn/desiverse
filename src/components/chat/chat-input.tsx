// src/components/chat/chat-input.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Mic, Video, SmilePlus, Paperclip } from 'lucide-react';
import React, { useState } from 'react';
import type { CharacterName } from '@/lib/types';

interface ChatInputProps {
  onSendMessage: (message: string, type?: 'text' | 'audio_request' | 'video_request') => void;
  isLoading: boolean;
  characterName?: CharacterName;
}

export function ChatInput({ onSendMessage, isLoading, characterName = "your Bae" }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), 'text'); 
      setInputValue('');
    }
  };
  
  const handleSpecialRequest = (type: 'audio_request' | 'video_request') => {
     if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), type);
      setInputValue('');
    } else if (!isLoading) {
      const messageContent = inputValue.trim() || (type === 'audio_request' ? `Send me a voice message, ${characterName}!` : `Show me a video, ${characterName}!`);
      onSendMessage(messageContent, type);
      setInputValue(''); 
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 md:p-4 border-t border-border/50 bg-card/70 backdrop-blur-sm flex items-end space-x-2 sticky bottom-0"
      aria-label="Chat input form"
    >
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        disabled={isLoading}
        aria-label="Emoji"
        className="text-muted-foreground hover:text-primary rounded-full p-2 hidden sm:inline-flex"
        title="Emoji (coming soon!)"
      >
        <SmilePlus className="h-5 w-5" />
      </Button>
       <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        disabled={isLoading}
        aria-label="Attach file"
        className="text-muted-foreground hover:text-primary rounded-full p-2 hidden sm:inline-flex"
        title="Attach file (coming soon!)"
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={`Bolo kya haal chaal, ${characterName}?`}
        className="flex-grow resize-none max-h-32 p-3 rounded-2xl shadow-inner focus:ring-primary focus:border-primary bg-background/70 border-border text-sm md:text-base"
        rows={1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={isLoading}
        aria-label="Message input"
      />
      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => handleSpecialRequest('audio_request')} 
          disabled={isLoading}
          aria-label="Request voice message"
          className="text-primary hover:text-primary/80 rounded-full p-2.5 aspect-square"
          title="Request voice message"
        >
          <Mic className="h-5 w-5" />
        </Button>
        <Button 
          type="submit" 
          variant="default" 
          size="icon" 
          disabled={isLoading || !inputValue.trim()}
          aria-label="Send message"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2.5 aspect-square shadow-lg transform transition-transform hover:scale-110"
          title="Send message"
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
