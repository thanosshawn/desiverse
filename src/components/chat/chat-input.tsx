
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
import { useRouter } from 'next/navigation'; // Import useRouter
import { useToast } from '@/hooks/use-toast'; // Import useToast

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
  const router = useRouter(); // Initialize useRouter
  const { toast } = useToast(); // Initialize useToast

  const isPremiumFeatureLocked = characterIsPremium && userSubscriptionTier === 'free';
  const canAffordGifts = userSubscriptionTier === 'premium' || userSubscriptionTier === 'spicy';


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
     if (isPremiumFeatureLocked && type === 'audio_request') {
        toast({
          title: 'Premium Feature Locked 💎',
          description: `Voice messages with ${characterName} are a premium feature. Please upgrade your plan.`,
          variant: 'default',
        });
        router.push(`/subscribe?feature=Voice Chat&characterName=${characterName}`);
        return;
     }
     if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), type);
      setInputValue('');
    } else if (!isLoading) {
      const messageContent = inputValue.trim() || (type === 'audio_request' ? `Send me a voice message, ${characterName}!` : `Show me a video, ${characterName}!`);
      onSendMessage(messageContent, type);
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
    if (gift.isPremium && userSubscriptionTier === 'free') {
      toast({
        title: 'Premium Gift! 🎁',
        description: `Sending a ${gift.name} is a premium feature. Please upgrade to spoil ${characterName}!`,
        variant: 'default',
      });
      router.push(`/subscribe?feature=Sending a ${gift.name}&itemName=${gift.id}`);
      setShowGiftPicker(false);
      return;
    }
    onSendMessage(inputValue.trim(), 'text', gift); 
    setInputValue(''); 
    setShowGiftPicker(false); 
  };

  const voiceButtonDisabled = isLoading || (isPremiumFeatureLocked && characterIsPremium);
  const voiceButtonTitle = isPremiumFeatureLocked && characterIsPremium
    ? `Unlock Premium Voice Chat with ${characterName}!`
    : "Request voice message";

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
      {/* Emoji Picker Popover */}
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

      {/* Gift Picker Popover */}
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
            className="w-72 p-2 border-border shadow-xl bg-popover mb-2 rounded-xl" 
            side="top" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-popover-foreground px-2 pt-1">Send a Virtual Gift to {characterName}</p>
            {virtualGifts.map((gift) => (
              <Button
                key={gift.id}
                variant="ghost"
                className="w-full justify-start h-auto p-2 text-left !rounded-md hover:bg-accent/80 focus:bg-accent"
                onClick={() => handleSendGift(gift)}
                title={gift.isPremium && userSubscriptionTier === 'free' ? `Upgrade to send a ${gift.name}` : `Send ${gift.name}`}
              >
                {renderGiftIcon(gift.iconName)}
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-popover-foreground">{gift.name}</span>
                    <span className="text-xs text-muted-foreground">{gift.description}</span>
                </div>
                {gift.price && (
                    <span className={`ml-auto text-xs font-semibold ${gift.isPremium && userSubscriptionTier === 'free' ? 'text-destructive' : 'text-primary'}`}>
                        {gift.isPremium && userSubscriptionTier === 'free' ? 'Premium!' : `₹${gift.price}`}
                    </span>
                )}
              </Button>
            ))}
            {userSubscriptionTier === 'free' && (
                 <Button 
                    variant="default" 
                    className="w-full mt-2 !rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                    onClick={() => router.push('/subscribe?feature=Premium Gifts')}
                >
                    Unlock All Gifts & Go Premium! ✨
                </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Paperclip (Attach file - still placeholder) */}
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
          disabled={voiceButtonDisabled && !(isPremiumFeatureLocked && characterIsPremium)} // Allow click to redirect if locked
          aria-label={voiceButtonTitle}
          className={`rounded-full p-2.5 aspect-square ${isPremiumFeatureLocked && characterIsPremium ? 'text-amber-500 hover:text-amber-600 cursor-pointer' : voiceButtonDisabled ? 'text-muted-foreground/70 cursor-not-allowed' : 'text-primary hover:text-primary/80'}`}
          title={voiceButtonTitle}
        >
          {isPremiumFeatureLocked && characterIsPremium ? <Lock className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
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
