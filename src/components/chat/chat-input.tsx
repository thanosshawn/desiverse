
// src/components/chat/chat-input.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Mic, Paperclip, SmilePlus, Lock, Gift as GiftIcon, LucideIcon } from 'lucide-react'; 
import React, { useState, useRef } from 'react';
import type { CharacterName, UserProfile, VirtualGift } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Picker, { type EmojiClickData, Theme as EmojiTheme, Categories as EmojiCategory } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { virtualGifts } from '@/lib/gifts'; 
import * as Icons from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { isFeatureLocked, getFeatureLockDetails } from '@/lib/premium'; 

interface ChatInputProps {
  onSendMessage: (message: string, type?: 'text' | 'audio_request' | 'video_request', gift?: VirtualGift) => void; 
  isLoading: boolean;
  characterName?: CharacterName;
  characterIsPremium?: boolean;
  userSubscriptionTier?: UserProfile['subscriptionTier'];
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  characterName = "your Bae",
  characterIsPremium,
  userSubscriptionTier,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false); 
  const { resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const isVoiceChatLocked = isFeatureLocked(
    'premium_voice_message',
    userSubscriptionTier,
    { characterIsPremium }
  );

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), 'text');
      setInputValue('');
      setShowEmojiPicker(false); 
      setShowGiftPicker(false);
    }
  };
  
  const handleSpecialRequest = (type: 'audio_request' | 'video_request') => {
     if (type === 'audio_request' && isVoiceChatLocked) {
        const details = getFeatureLockDetails('premium_voice_message', { characterName });
        toast({ title: details.title, description: details.description, variant: 'default' });
        router.push(`/subscribe?${details.subscribeQuery}`);
        return;
     }
     
     if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), type);
      setInputValue(''); 
    } else if (!isLoading) {
      const defaultRequestText = type === 'audio_request' 
        ? `Sent a request for a voice message to ${characterName}.` 
        : `Sent a request for a video reply to ${characterName}.`;
      onSendMessage(defaultRequestText, type); 
      setInputValue(''); 
    }
    setShowEmojiPicker(false); 
    setShowGiftPicker(false);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const currentCursorPosition = textareaRef.current?.selectionStart;

    if (typeof currentCursorPosition === 'number') {
      const textBeforeCursor = inputValue.substring(0, currentCursorPosition);
      const textAfterCursor = inputValue.substring(currentCursorPosition);
      setInputValue(textBeforeCursor + emoji + textAfterCursor);
      
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

  const handleSendGift = (gift: VirtualGift) => {
    const isThisGiftLocked = isFeatureLocked(
        'premium_gift', 
        userSubscriptionTier
        // If individual gifts had premium flags: { giftIsPremium: gift.isPremium }
    );

    if (isThisGiftLocked) {
      const details = getFeatureLockDetails('premium_gift', { characterName, itemName: gift.name });
      toast({ title: details.title, description: details.description, variant: 'default' });
      router.push(`/subscribe?${details.subscribeQuery}`);
      setShowGiftPicker(false);
      return;
    }

    onSendMessage(inputValue.trim(), 'text', gift); 
    setInputValue(''); 
    setShowGiftPicker(false); 
  };

  const voiceButtonTitle = isVoiceChatLocked 
    ? getFeatureLockDetails('premium_voice_message', { characterName }).title 
    : "Request voice message";
  const voiceButtonDisabled = isLoading; 

  const renderGiftIcon = (iconName: keyof typeof Icons) => {
    const IconComponent = Icons[iconName] as LucideIcon;
    return IconComponent ? <IconComponent className="h-5 w-5 mr-2 text-primary" /> : <GiftIcon className="h-5 w-5 mr-2 text-primary"/>;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 md:p-4 border-t border-border/50 bg-card/70 backdrop-blur-sm flex items-end space-x-1 sm:space-x-2 sticky bottom-0"
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
            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGiftPicker(false); }}
          >
            <SmilePlus className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
            className="w-auto p-0 border-none shadow-xl bg-transparent mb-2" 
            side="top" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()} 
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Picker
            onEmojiClick={onEmojiClick}
            autoFocusSearch={false}
            theme={resolvedTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            searchPlaceholder="Search emoji"
            emojiVersion="5.0"
            lazyLoadEmojis={true}
            categories={[EmojiCategory.SUGGESTED, EmojiCategory.SMILEYS_PEOPLE, EmojiCategory.ANIMALS_NATURE, EmojiCategory.FOOD_DRINK, EmojiCategory.TRAVEL_PLACES, EmojiCategory.ACTIVITIES, EmojiCategory.OBJECTS, EmojiCategory.SYMBOLS, EmojiCategory.FLAGS]}
            height={350}
            previewConfig={{ showPreview: false }}
          />
        </PopoverContent>
      </Popover>

      <Popover open={showGiftPicker} onOpenChange={setShowGiftPicker}>
        <PopoverTrigger asChild>
           <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            disabled={isLoading}
            aria-label="Send a gift"
            className="text-muted-foreground hover:text-primary rounded-full p-2"
            title="Send a gift"
            onClick={() => { setShowGiftPicker(!showGiftPicker); setShowEmojiPicker(false); }}
          >
            <GiftIcon className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
            className="w-80 p-2 border-border shadow-xl bg-white dark:bg-neutral-900 mb-2 rounded-xl"
            side="top" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 px-2 pt-1">Send a Virtual Gift to {characterName}</p>
            {virtualGifts.map((gift) => {
                const isThisSpecificGiftLocked = isFeatureLocked('premium_gift', userSubscriptionTier /*, { giftIsPremium: gift.isPremium } */);
                return (
                    <Button
                        key={gift.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-2 text-left !rounded-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:focus:bg-neutral-800 dark:focus:text-neutral-100"
                        onClick={() => handleSendGift(gift)}
                        title={isThisSpecificGiftLocked ? getFeatureLockDetails('premium_gift', { itemName: gift.name, characterName }).title : `Send ${gift.name}`}
                    >
                        {renderGiftIcon(gift.iconName)}
                        <div className="flex flex-col flex-grow min-w-0 mr-2">
                            <span className="text-sm font-medium block whitespace-normal">{gift.name}</span>
                            <span className="text-xs text-muted-foreground dark:text-neutral-400 block whitespace-normal">{gift.description}</span>
                        </div>
                        {isThisSpecificGiftLocked && (
                           <Lock className="h-4 w-4 text-amber-500 ml-auto flex-shrink-0" />
                        )}
                         {gift.price && !isThisSpecificGiftLocked && (
                            <span className={`ml-auto text-xs font-semibold text-primary`}>
                                ₹{gift.price}
                            </span>
                        )}
                    </Button>
                );
            })}
            {userSubscriptionTier === 'free' && (
                 <Button 
                    variant="default" 
                    className="w-full mt-2 !rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                    onClick={() => {
                        const details = getFeatureLockDetails('premium_gift', { characterName });
                        router.push(`/subscribe?${details.subscribeQuery}`);
                    }}
                >
                    Unlock All Gifts & Go Premium! ✨
                </Button>
            )}
          </div>
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
        onClick={() => { setShowEmojiPicker(false); setShowGiftPicker(false); }} 
      />
      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => handleSpecialRequest('audio_request')} 
          disabled={voiceButtonDisabled}
          aria-label={voiceButtonTitle}
          className={`rounded-full p-2.5 aspect-square ${isVoiceChatLocked ? 'text-amber-500 hover:text-amber-600 cursor-pointer' : voiceButtonDisabled ? 'text-muted-foreground/70 cursor-not-allowed' : 'text-primary hover:text-primary/80'}`}
          title={voiceButtonTitle}
        >
          {isVoiceChatLocked ? <Lock className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button 
          type="submit" 
          variant="default" 
          size="icon" 
          disabled={isLoading || (!inputValue.trim())} 
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

