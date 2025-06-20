
// src/components/chat/chat-input.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Mic, Paperclip, SmilePlus, Lock, Gift as GiftIcon, LucideIcon, Sparkles, Gem } from 'lucide-react'; 
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
import { cn } from '@/lib/utils';

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
    );

    if (isThisGiftLocked) {
      const details = getFeatureLockDetails('premium_gift', { itemName: gift.name, characterName });
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
      className="p-3 md:p-4 border-t border-border/30 bg-card/90 backdrop-blur-md flex items-end space-x-1.5 sm:space-x-2 sticky bottom-0 shadow-[-2px_0px_15px_rgba(0,0,0,0.08)]"
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
            className="text-muted-foreground hover:text-primary rounded-full p-2.5 hidden sm:inline-flex transition-colors duration-200 hover:bg-primary/10 transform hover:scale-110"
            title="Select an emoji"
            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGiftPicker(false); }}
          >
            <SmilePlus className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
            className="w-auto p-0 border-border/50 shadow-2xl bg-popover mb-2 rounded-2xl backdrop-blur-lg"
            side="top" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()} 
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Picker
            onEmojiClick={onEmojiClick}
            autoFocusSearch={false}
            theme={resolvedTheme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            searchPlaceholder="Search emoji..."
            emojiVersion="5.0"
            lazyLoadEmojis={true}
            categories={[EmojiCategory.SUGGESTED, EmojiCategory.SMILEYS_PEOPLE, EmojiCategory.ANIMALS_NATURE, EmojiCategory.FOOD_DRINK, EmojiCategory.TRAVEL_PLACES, EmojiCategory.ACTIVITIES, EmojiCategory.OBJECTS, EmojiCategory.SYMBOLS, EmojiCategory.FLAGS]}
            height={350}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            className="!rounded-2xl !border-none"
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
            className="text-muted-foreground hover:text-primary rounded-full p-2.5 transition-colors duration-200 hover:bg-primary/10 transform hover:scale-110"
            title="Send a gift"
            onClick={() => { setShowGiftPicker(!showGiftPicker); setShowEmojiPicker(false); }}
          >
            <GiftIcon className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
            className="w-80 p-3 border-border/50 shadow-2xl bg-popover backdrop-blur-lg mb-2 rounded-2xl"
            side="top" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <p className="text-base font-headline text-primary px-1 pt-1">Gifts for {characterName} <Sparkles className="inline h-4 w-4 text-yellow-400"/></p>
            {virtualGifts.map((gift) => {
                const isThisSpecificGiftLocked = isFeatureLocked('premium_gift', userSubscriptionTier);
                return (
                    <Button
                        key={gift.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 text-left !rounded-xl text-card-foreground hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors duration-150"
                        onClick={() => handleSendGift(gift)}
                        title={isThisSpecificGiftLocked ? getFeatureLockDetails('premium_gift', { itemName: gift.name, characterName }).title : `Send ${gift.name}`}
                    >
                        {renderGiftIcon(gift.iconName)}
                        <div className="flex flex-col flex-grow min-w-0 mr-2">
                            <span className="text-sm font-medium block whitespace-normal">{gift.name}</span>
                            <span className="text-xs text-muted-foreground block whitespace-normal">{gift.description}</span>
                        </div>
                        {isThisSpecificGiftLocked && (
                           <Lock className="h-4 w-4 text-amber-500 ml-auto flex-shrink-0" />
                        )}
                         {gift.price && !isThisSpecificGiftLocked && (
                            <span className={`ml-auto text-xs font-semibold text-green-500`}>
                                ₹{gift.price}
                            </span>
                        )}
                    </Button>
                );
            })}
            {userSubscriptionTier === 'free' && (
                 <Button 
                    variant="default" 
                    className="w-full mt-2.5 !rounded-xl bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground shadow-md hover:shadow-lg py-2.5"
                    onClick={() => {
                        const details = getFeatureLockDetails('premium_gift', { characterName });
                        router.push(`/subscribe?${details.subscribeQuery}`);
                    }}
                >
                    Unlock All Gifts & Go Premium! <Gem className="ml-2 h-4 w-4"/>
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
        className="text-muted-foreground hover:text-primary rounded-full p-2.5 hidden sm:inline-flex transition-colors duration-200 hover:bg-primary/10 transform hover:scale-110"
        title="Attach file (coming soon!)"
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      <Textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={`Message ${characterName}...`}
        className="flex-grow resize-none max-h-36 p-3.5 rounded-2xl shadow-inner focus:ring-2 focus:ring-primary focus:border-primary bg-background/80 border-border/70 text-sm md:text-base transition-shadow duration-200 focus:shadow-md"
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
      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => handleSpecialRequest('audio_request')} 
          disabled={voiceButtonDisabled}
          aria-label={voiceButtonTitle}
          className={cn(
            "rounded-full p-2.5 aspect-square transition-all duration-200 ease-in-out transform hover:scale-110",
            isVoiceChatLocked ? 'text-amber-500 hover:bg-amber-500/10 cursor-pointer' : 
            voiceButtonDisabled ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:bg-primary/10'
          )}
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
          className="bg-gradient-to-br from-primary via-rose-500 to-pink-600 hover:shadow-glow-primary text-primary-foreground rounded-full p-2.5 aspect-square shadow-lg transform transition-transform hover:scale-110 focus:ring-2 ring-primary ring-offset-2 ring-offset-background"
          title="Send message"
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
