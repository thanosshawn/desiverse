
// src/app/chat/[characterId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ChatLayout } from '@/components/chat/chat-layout';
import type { ChatMessageUI, CharacterMetadata, UserChatSessionMetadata, MessageDocument, CharacterName, UserChatStreakData, UserProfile, VirtualGift } from '@/lib/types';
import { handleUserMessageAction } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCharacterMetadata,
  getOrCreateChatSession,
  getMessagesStream,
  addMessageToChat,
  updateChatSessionMetadata,
  updateUserChatStreak,
  getStreakDataStream
} from '@/lib/firebase/rtdb';
import { Loader2, Sparkles } from 'lucide-react';
import { ChatPageHeader } from '@/components/chat/chat-page-header';

export default function ChatPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const paramsFromHook = useParams();
  const characterId = paramsFromHook.characterId as string;

  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [currentCharacterMeta, setCurrentCharacterMeta] = useState<CharacterMetadata | null>(null);
  const [currentChatSessionMeta, setCurrentChatSessionMeta] = useState<UserChatSessionMetadata | null>(null);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentStreakData, setCurrentStreakData] = useState<UserChatStreakData | null>(null);

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  },[]);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  useEffect(() => {
    const bodyEl = document.body;
    const htmlEl = document.documentElement;
    if (currentCharacterMeta?.backgroundImageUrl) {
      const rootStyle = getComputedStyle(htmlEl);
      const bgHslString = rootStyle.getPropertyValue('--background').trim();
      const hslMatch = bgHslString.match(/(?:hsl\(\s*)?([\d.]+)\s*[\s,]\s*([\d.]+%?)\s*[\s,]\s*([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?(?:\s*\))?/);
      let overlayColor = 'hsla(var(--background), 0.7)'; 

      if (hslMatch && hslMatch.length >= 4) {
        const alpha = hslMatch[4] ? parseFloat(hslMatch[4]) * 0.7 : 0.7; 
        overlayColor = `hsla(${hslMatch[1]}, ${hslMatch[2]}, ${hslMatch[3]}, ${alpha})`;
      }
      
      bodyEl.style.backgroundImage = `linear-gradient(${overlayColor}, ${overlayColor}), url(${currentCharacterMeta.backgroundImageUrl})`;
      bodyEl.style.backgroundSize = 'cover';
      bodyEl.style.backgroundPosition = 'center';
      bodyEl.style.backgroundRepeat = 'no-repeat';
      bodyEl.style.backgroundAttachment = 'fixed';
      
      if (pageLoading) {
        htmlEl.style.setProperty('--chat-page-initial-bg-image', `linear-gradient(${overlayColor}, ${overlayColor}), url(${currentCharacterMeta.backgroundImageUrl})`);
      }
    } else {
      bodyEl.style.backgroundImage = '';
      htmlEl.style.removeProperty('--chat-page-initial-bg-image');
    }

    return () => { 
      bodyEl.style.backgroundImage = '';
      bodyEl.style.backgroundSize = '';
      bodyEl.style.backgroundPosition = '';
      bodyEl.style.backgroundRepeat = '';
      bodyEl.style.backgroundAttachment = '';
      htmlEl.style.removeProperty('--chat-page-initial-bg-image');
    };
  }, [currentCharacterMeta?.backgroundImageUrl, pageLoading]);


  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({ title: 'Dil Ke Connections 💖', description: 'Login karke apni bae se baat karo!', variant: 'default' });
      router.push(`/login?redirect=/chat/${characterId}`);
      return;
    }

    if (!characterId) {
      toast({ title: 'Character Not Specified', variant: 'destructive' });
      router.push('/');
      return;
    }

    const initializeChat = async () => {
      setPageLoading(true);
      try {
        const charMeta = await getCharacterMetadata(characterId);
        if (!charMeta) {
          toast({ title: 'Bae Not Found 😟', description: "Aisa lagta hai yeh Bae abhi yahaan nahi hai.", variant: 'destructive' });
          router.push('/');
          return;
        }
        setCurrentCharacterMeta(charMeta);

        const chatSessionMeta = await getOrCreateChatSession(user.uid, characterId);
        setCurrentChatSessionMeta(chatSessionMeta);
        setIsFavorite(chatSessionMeta.isFavorite || false);
      } catch (error: any) {
        console.error("Error initializing chat:", error);
        toast({ title: 'Chat Shuru Nahi Ho Paya', description: error.message || "Kuch toh gadbad hai, try again!", variant: 'destructive' });
        router.push('/');
      }
    };

    initializeChat();
  }, [user, authLoading, characterId, router, toast]);

  useEffect(() => {
    if (!user || !characterId || !currentChatSessionMeta) return;

    const unsubscribeMessages = getMessagesStream(
      user.uid,
      characterId,
      (rtdbMessages) => {
        const uiMessages: ChatMessageUI[] = rtdbMessages.map(doc => {
          const baseMessage: ChatMessageUI = {
            id: doc.id,
            rtdbKey: doc.id,
            sender: doc.sender,
            type: doc.messageType === 'audio' ? 'audio' :
                  doc.messageType === 'video' ? 'video' :
                  doc.messageType === 'gift_sent' ? 'gift_sent' : 'text',
            content: doc.text,
            characterName: doc.sender === 'ai' ? currentCharacterMeta?.name : undefined,
            timestamp: new Date(doc.timestamp as number),
            audioSrc: doc.audioUrl || undefined,
            videoSrc: doc.videoUrl || undefined,
          };
          if (doc.messageType === 'gift_sent' && doc.sentGiftId) {
            baseMessage.sentGift = { 
                id: doc.sentGiftId,
                name: doc.text.includes("sent ") ? doc.text.split("sent ")[1].split(" to")[0] : "a gift", 
                iconName: 'Gift', 
                description: "A lovely gift", 
                aiReactionPrompt: "", 
                isPremium: true, 
            };
          }
          return baseMessage;
        });
        setMessages(uiMessages);
        if(pageLoading) setPageLoading(false); 
      },
      50 
    );

    const unsubscribeStreak = getStreakDataStream(user.uid, characterId, setCurrentStreakData);

    return () => {
      unsubscribeMessages();
      unsubscribeStreak();
    };
  }, [user, characterId, currentChatSessionMeta, currentCharacterMeta?.name, pageLoading]);

  const addOptimisticMessage = (message: Omit<ChatMessageUI, 'id' | 'timestamp' | 'rtdbKey'>): string => {
    const optimisticId = crypto.randomUUID();
    const optimisticMessage: ChatMessageUI = {
      ...message,
      id: optimisticId,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    return optimisticId;
  };

  const removeOptimisticMessage = (optimisticId: string) => {
     setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
  };
  
  const userDisplayName = userProfile?.name || user?.displayName || 'User';

  const handleSendMessage = useCallback(async (userInput: string, requestType?: 'text' | 'audio_request' | 'video_request', gift?: VirtualGift) => {
    if (!user || !currentCharacterMeta || !currentChatSessionMeta) {
      toast({ title: 'Cannot send message', description: 'User or character not loaded.', variant: 'destructive' });
      return;
    }

    let userMessageText = userInput;
    let messageTypeForRtdb: MessageDocument['messageType'] = 'text';
    let sentGiftIdForRtdb: string | undefined = undefined;
    let giftReactionPromptForAI: string | undefined = undefined;

    if (gift) {
      userMessageText = `You sent ${gift.name} to ${currentCharacterMeta.name}. ${userInput ? `You also said: "${userInput}"` : ''}`;
      addOptimisticMessage({
        sender: 'user',
        type: 'gift_sent',
        content: userMessageText, 
        sentGift: gift,
      });
      messageTypeForRtdb = 'gift_sent';
      sentGiftIdForRtdb = gift.id;
      giftReactionPromptForAI = gift.aiReactionPrompt;
    } else {
       addOptimisticMessage({
        sender: 'user',
        type: 'text',
        content: userInput,
      });
    }

    setIsLoadingMessage(true);
    setCurrentVideoSrc(undefined); 

    try {
      const userMessageData: Omit<MessageDocument, 'timestamp'> = {
        sender: 'user',
        text: userMessageText, 
        messageType: messageTypeForRtdb,
        sentGiftId: sentGiftIdForRtdb || null,
      };
      await addMessageToChat(user.uid, characterId, userMessageData);

      try {
        const streakResult = await updateUserChatStreak(user.uid, characterId);
        let streakToastMessage = '';
        let toastTitle = "Chat Streak Update! 🔥";
        switch (streakResult.status) {
          case 'first_ever': 
            streakToastMessage = `Pehli mulaqat aur streak shuru! Day ${streakResult.streak}! 💖 Keep it going!`; 
            toastTitle = "New Chat Streak Started! ✨";
            break;
          case 'continued': 
            streakToastMessage = `Streak jaari hai: ${streakResult.streak} din! 🎉 Keep the flame alive!`; 
            toastTitle = `Chat Streak: Day ${streakResult.streak}! 🔥`;
            break;
          case 'reset': 
            streakToastMessage = `Streak toot gayi! 💔 Koi baat nahi, naya din, nayi shuruaat! Day ${streakResult.streak} 💪`; 
            toastTitle = "Chat Streak Reset! 🔁";
            break;
          case 'maintained_same_day': break; 
        }
        if (streakToastMessage) toast({ title: toastTitle, description: streakToastMessage, duration: 4000 });
      } catch (streakError) { console.error("Error updating chat streak:", streakError); }

      const optimisticAiLoadingId = addOptimisticMessage({
        sender: 'ai',
        type: 'loading',
        content: `${currentCharacterMeta.name} is typing… kuch special hi hoga ✨`,
        characterName: currentCharacterMeta.name as CharacterName,
      });

      const aiResponse = await handleUserMessageAction(
        userInput, 
        messages.filter(m => m.type !== 'loading' && m.type !== 'error').map(m => ({ 
            id: m.rtdbKey || m.id, 
            sender: m.sender,
            content: m.content,
            timestamp: m.timestamp.getTime(), 
        })), 
        currentCharacterMeta,
        user.uid,
        characterId,
        userDisplayName, 
        giftReactionPromptForAI 
      );

      removeOptimisticMessage(optimisticAiLoadingId);

      if (aiResponse.error || !aiResponse.text) {
         addOptimisticMessage({
            sender: 'ai',
            type: 'error',
            content: aiResponse.error || "AI response error.",
            characterName: currentCharacterMeta.name as CharacterName,
        });
        toast({ title: 'AI Error', description: aiResponse.error || "Failed to get AI response.", variant: 'destructive' });
      } else {
        const aiMessageData: Omit<MessageDocument, 'timestamp'> = {
          sender: 'ai',
          text: aiResponse.text,
          messageType: aiResponse.videoDataUri ? 'video' : aiResponse.audioDataUri ? 'audio' : 'text',
          audioUrl: aiResponse.audioDataUri || null,
          videoUrl: aiResponse.videoDataUri || null,
        };
        await addMessageToChat(user.uid, characterId, aiMessageData);

        if (aiResponse.videoDataUri) {
          setCurrentVideoSrc(aiResponse.videoDataUri); 
        }
      }
    } catch (error: any) {
      console.error("Send message error:", error);
      removeOptimisticMessage(messages.find(m => m.type === 'loading')?.id || '');
      addOptimisticMessage({
        sender: 'ai',
        type: 'error',
        content: error.message || 'Failed to send or process message.',
        characterName: currentCharacterMeta.name as CharacterName,
      });
      toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoadingMessage(false);
    }
  }, [user, currentCharacterMeta, currentChatSessionMeta, characterId, messages, toast, userDisplayName]);

  const toggleFavoriteChat = async () => {
    if (!user || !characterId) return;
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus); 
    try {
      await updateChatSessionMetadata(user.uid, characterId, { isFavorite: newFavoriteStatus });
      toast({
        title: newFavoriteStatus ? 'Favorite Chat ⭐' : 'Unfavorited Chat',
        description: `${currentCharacterMeta?.name} ${newFavoriteStatus ? 'is now a favorite! So romantic!' : 'is no longer a favorite.'}`,
      });
    } catch (error) {
      console.error("Error updating favorite status:", error);
      setIsFavorite(!newFavoriteStatus); 
      toast({ title: 'Error', description: 'Could not update favorite status.', variant: 'destructive' });
    }
  };

  const bondPercentage = useMemo(() => {
    if (!currentCharacterMeta || !currentStreakData) return 0;
    const numMessages = messages.filter(m => m.type !== 'loading' && m.type !== 'error' && m.sender === 'user').length;
    const streakValue = currentStreakData?.currentStreak || 0;
    const messageScore = Math.min(numMessages / 50, 1) * 50; 
    const streakScore = Math.min(streakValue / 7, 1) * 50;   
    return Math.max(0, Math.min(100, Math.round(messageScore + streakScore)));
  }, [messages, currentStreakData, currentCharacterMeta]);


  if (authLoading || pageLoading || !currentCharacterMeta || !currentChatSessionMeta) {
    const initialBackgroundStyle = currentCharacterMeta?.backgroundImageUrl
    ? {
        backgroundImage: `var(--chat-page-initial-bg-image, var(--background))`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : {
        background: 'var(--background)', 
    };
    return (
      <div className="flex flex-col h-screen bg-background text-foreground items-center justify-center" style={initialBackgroundStyle}>
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-xl font-headline text-muted-foreground bg-card/80 p-4 rounded-2xl shadow-lg">
            Thoda intezaar... <Sparkles className="inline h-6 w-6 text-yellow-400 animate-pulse" /> Aapki chat {currentCharacterMeta?.name || 'aapki Bae'} ke saath load ho rahi hai! 💖
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-transparent"> 
      <Header />
      <ChatPageHeader
        characterMeta={currentCharacterMeta}
        isFavorite={isFavorite}
        toggleFavoriteChat={toggleFavoriteChat}
        bondPercentage={bondPercentage}
        currentStreakData={currentStreakData}
        router={router}
      />
      <main className="flex-grow overflow-hidden"> 
        <ChatLayout
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoadingMessage}
          currentCharacterName={currentCharacterMeta.name as CharacterName}
          currentCharacterAvatar={currentCharacterMeta.avatarUrl}
          currentVideoMessageSrc={currentVideoSrc}
          characterMessageBubbleStyle={currentCharacterMeta.messageBubbleStyle}
          characterIsPremium={currentCharacterMeta.isPremium}
          userSubscriptionTier={userProfile?.subscriptionTier}
          userDisplayName={userDisplayName}
          userProfileAvatarUrl={userProfile?.avatarUrl} // Pass userProfile avatar
          userFirebaseAuthAvatarUrl={user?.photoURL} // Pass Firebase Auth avatar
        />
      </main>
      <div ref={messagesEndRef} /> 
    </div>
  );
}
