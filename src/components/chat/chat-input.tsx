'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Mic, Video } from 'lucide-react';
import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string, type?: 'text' | 'audio_request' | 'video_request') => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };
  
  const handleSpecialRequest = (type: 'audio_request' | 'video_request') => {
     if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), type);
      setInputValue('');
    } else if (!isLoading) {
      // Send a generic request if input is empty
      const defaultMessage = type === 'audio_request' ? "Send me a voice message." : "Send me a video message.";
      onSendMessage(defaultMessage, type);
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
        placeholder="Type your message to Riya..."
        className="flex-grow resize-none_ max-h-24 p-3 rounded-lg shadow-inner focus:ring-primary focus:border-primary"
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
      >
        <SendHorizonal className="h-6 w-6" />
      </Button>
    </form>
  );
}
