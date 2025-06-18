
// src/components/chat/chat-input.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Mic, Paperclip, SmilePlus } from 'lucide-react';
import React, { useState, useRef } from 'react';
import type { CharacterName } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Picker, { type EmojiClickData, Theme as EmojiTheme, Categories as EmojiCategory } from 'emoji-picker-react';
import { useTheme } from 'next-themes'; // To adapt emoji picker theme

interface ChatInputProps {
  onSendMessage: (message: string, type?: 'text' | 'audio_request' | 'video_request') => void;
  isLoading: boolean;
  characterName?: CharacterName;
}

export function ChatInput({ onSendMessage, isLoading, characterName = "your Bae" }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), 'text');
      setInputValue('');
      setShowEmojiPicker(false); // Close picker on send
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
    setShowEmojiPicker(false); // Close picker
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const currentCursorPosition = textareaRef.current?.selectionStart;

    if (typeof currentCursorPosition === 'number') {
      const textBeforeCursor = inputValue.substring(0, currentCursorPosition);
      const textAfterCursor = inputValue.substring(currentCursorPosition);
      setInputValue(textBeforeCursor + emoji + textAfterCursor);
      
      // Set cursor position after emoji insertion
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(currentCursorPosition + emoji.length, currentCursorPosition + emoji.length);
      }, 0);

    } else {
      setInputValue((prevValue) => prevValue + emoji);
       setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 md:p-4 border-t border-border/50 bg-card/70 backdrop-blur-sm flex items-end space-x-2 sticky bottom-0"
      aria-label="Chat input form"
    >
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLoading}
            aria-label="Emoji"
            className="text-muted-foreground hover:text-primary rounded-full p-2 hidden sm:inline-flex"
            title="Select an emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <SmilePlus className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
            className="w-auto p-0 border-none shadow-xl bg-transparent mb-2" 
            side="top" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Picker
            onEmojiClick={onEmojiClick}
            autoFocusSearch={false}
            theme={resolvedTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            searchPlaceholder="Search emoji"
            emojiVersion="5.0"
            lazyLoadEmojis={true}
            categories={[
                EmojiCategory.SUGGESTED,
                EmojiCategory.SMILEYS_PEOPLE,
                EmojiCategory.ANIMALS_NATURE,
                EmojiCategory.FOOD_DRINK,
                EmojiCategory.TRAVEL_PLACES,
                EmojiCategory.ACTIVITIES,
                EmojiCategory.OBJECTS,
                EmojiCategory.SYMBOLS,
                EmojiCategory.FLAGS,
            ]}
            height={350}
            // width={320} // You can set a fixed width if needed
            previewConfig={{ showPreview: false }}
          />
        </PopoverContent>
      </Popover>

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
        ref={textareaRef}
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
        onClick={() => setShowEmojiPicker(false)} // Close picker when textarea is clicked
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
