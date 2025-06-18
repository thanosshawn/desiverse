// src/components/chat/chat-input.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Mic, Video } from 'lucide-react';
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
      onSendMessage(inputValue.trim(), 'text'); // Explicitly text type
      setInputValue('');
    }
  };
  
  const handleSpecialRequest = (type: 'audio_request' | 'video_request') => {
     if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), type); // Message with special request
      setInputValue('');
    } else if (!isLoading) {
      // Send a generic request if input is empty, using current input value if any
      const messageContent = inputValue.trim() || (type === 'audio_request' ? `Send me a voice message, ${characterName}!` : `Show me a video, ${characterName}!`);
      onSendMessage(messageContent, type);
      setInputValue(''); // Clear input after sending generic request too
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-border bg-card flex items-center space-x-2"
      aria-label="Chat input form"
    >
      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={`Type your message to ${characterName}...`}
        className="flex-grow resize-none max-h-24 p-3 rounded-lg shadow-inner focus:ring-primary focus:border-primary"
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
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        onClick={() => handleSpecialRequest('audio_request')} 
        disabled={isLoading}
        aria-label="Request voice message"
        className="text-primary hover:text-primary/80"
        title="Request voice message"
      >
        <Mic className="h-6 w-6" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        onClick={() => handleSpecialRequest('video_request')} 
        disabled={isLoading}
        aria-label="Request video message"
        className="text-primary hover:text-primary/80"
        title="Request video message"
      >
        <Video className="h-6 w-6" />
      </Button>
      <Button 
        type="submit" 
        variant="default" 
        size="icon" 
        disabled={isLoading || !inputValue.trim()}
        aria-label="Send message"
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
        title="Send message"
      >
        <SendHorizonal className="h-6 w-6" />
      </Button>
    </form>
  );
}
