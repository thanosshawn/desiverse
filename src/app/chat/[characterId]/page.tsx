
// src/app/chat/[characterId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, use } from 'react'; // Added use
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ChatLayout } from '@/components/chat/chat-layout';
import type { ChatMessageUI, CharacterMetadata, UserChatSessionMetadata, MessageDocument, CharacterName, StreakUpdateResult, UserChatStreakData, UserProfile, VirtualGift } from '@/lib/types'; 
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
import { Loader2 } from 'lucide-react'; 
import { ChatPageHeader } from '@/components/chat/chat-page-header'; 

export default function ChatPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Unwrap params using React.use() to handle Next.js Proxy object
  const paramsFromHook = useParams();
  // Type assertion for actualParams might be needed if TypeScript complains about `use` with `useParams` return type.
  // However, Next.js docs suggest this pattern for its specific Proxy objects.
  const actualParams = use(paramsFromHook as any); 
  const characterId = actualParams.characterId as string;


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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (currentCharacterMeta?.backgroundImageUrl) {
      document.body.style.backgroundImage = `linear-gradient(rgba(var(--background-rgb),0.7), rgba(var(--background-rgb),0.7)), url(${currentCharacterMeta.backgroundImageUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = ''; 
    }
    
    const rootStyle = getComputedStyle(document.documentElement);
    let bgRgb = '330 50% 98%'; 
    const bgHslRaw = rootStyle.getPropertyValue('--background').trim();
    const bgHslMatch = bgHslRaw.match(/hsl\(([^)]+)\)/);

    if (bgHslMatch && bgHslMatch[1]) {
        const [h, s, l] = bgHslMatch[1].split(/[\s,]+/).map(v => v.trim());
        bgRgb = `${h}, ${s}, ${l}`;
    } else {
         console.warn("Could not parse HSL from --background. Using default for overlay.");
    }
    document.documentElement.style.setProperty('--background-rgb', bgRgb);


    return () => { 
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
    };
  }, [currentCharacterMeta?.backgroundImageUrl]);


  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({ title: 'Dil Ke Connections', description: 'Login karke apni bae se baat karo!', variant: 'default' });
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
          toast({ title: 'Character Not Found', variant: 'destructive' });
          router.push('/');
          return;
        }
        setCurrentCharacterMeta(charMeta);

        const chatSessionMeta = await getOrCreateChatSession(user.uid, characterId);
        setCurrentChatSessionMeta(chatSessionMeta);
        setIsFavorite(chatSessionMeta.isFavorite || false);
      } catch (error: any) {
        console.error("Error initializing chat:", error);
        toast({ title: 'Error Initializing Chat', description: error.message, variant: 'destructive' });
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
                name: doc.text.includes("sent a") ? doc.text.split("sent a ")[1].split(" to")[0] : "a gift", 
                iconName: 'Gift', 
                description: "A lovely gift",
                aiReactionPrompt: "" 
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

  const handleSendMessage = useCallback(async (userInput: string, requestType?: 'text' | 'audio_request' | 'video_request', gift?: VirtualGift) => {
    if (!user || !currentCharacterMeta || !currentChatSessionMeta) {
      toast({ title: 'Cannot send message', description: 'User or character not loaded.', variant: 'destructive' });
      return;
    }

    let userMessageText = userInput;
    let messageTypeForRtdb: MessageDocument['messageType'] = 'text';
    let sentGiftIdForRtdb: string | undefined = undefined;

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
        switch (streakResult.status) {
          case 'first_ever': streakToastMessage = `Chat Streak Started! Day ${streakResult.streak}! 💖 Keep it going!`; break;
          case 'continued': streakToastMessage = `Chat Streak: ${streakResult.streak} day${streakResult.streak > 1 ? 's' : ''}! 🔥 Keep the flame alive!`; break;
          case 'reset': streakToastMessage = `Streak Reset! Back to Day ${streakResult.streak} 💪 Let's build it up!`; break;
          case 'maintained_same_day': break;
        }
        if (streakToastMessage) toast({ title: "Chat Streak Update!", description: streakToastMessage, duration: 4000 });
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
        })).slice(-10), 
        currentCharacterMeta, 
        user.uid,
        characterId,
        gift?.aiReactionPrompt 
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
  }, [user, currentCharacterMeta, currentChatSessionMeta, characterId, messages, toast]); 

  const toggleFavoriteChat = async () => {
    if (!user || !characterId) return;
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);
    try {
      await updateChatSessionMetadata(user.uid, characterId, { isFavorite: newFavoriteStatus });
      toast({
        title: newFavoriteStatus ? 'Favorite Chat ⭐' : 'Unfavorited Chat',
        description: `${currentCharacterMeta?.name} ${newFavoriteStatus ? 'is now a favorite!' : 'is no longer a favorite.'}`,
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
        backgroundImage: `linear-gradient(rgba(var(--background-rgb),0.7), rgba(var(--background-rgb),0.7)), url(${currentCharacterMeta.backgroundImageUrl})`,
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
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground bg-card/80 p-3 rounded-lg shadow-md">
            Thoda intezaar... Aapki chat {currentCharacterMeta?.name || characterId || 'aapki Bae'} ke saath load ho rahi hai! 💖
          </p>
        </div>
      </div>
    );
  }
  
  const userDisplayName = userProfile?.name || user?.displayName || 'User';

  return (
    <div className="flex flex-col h-screen overflow-hidden"> 
      <Header />
      <ChatPageHeader
        characterMeta={currentCharacterMeta}
        isFavorite={isFavorite}
        toggleFavoriteChat={toggleFavoriteChat}
        bondPercentage={bondPercentage}
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
        />
      </main>
      <div ref={messagesEndRef} />
    </div>
  );
}

