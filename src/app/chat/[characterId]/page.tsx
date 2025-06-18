// src/app/chat/[characterId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ChatLayout } from '@/components/chat/chat-layout';
import type { ChatMessageUI, CharacterMetadata, UserChatSessionMetadata, MessageDocument, CharacterName } from '@/lib/types';
import { handleUserMessageAction } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCharacterMetadata, 
  getOrCreateChatSession, 
  getMessagesStream, 
  addMessageToChat,
  updateChatSessionMetadata
} from '@/lib/firebase/rtdb'; 
import { Loader2, Star } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  global.crypto = global.crypto || {} as Crypto;
  (global.crypto as any).randomUUID = uuidv4;
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const characterId = params.characterId as string;

  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [currentCharacterMeta, setCurrentCharacterMeta] = useState<CharacterMetadata | null>(null);
  const [currentChatSessionMeta, setCurrentChatSessionMeta] = useState<UserChatSessionMetadata | null>(null);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);

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
    let bgRgb = '330 50% 98%'; // Default light mode
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

    const unsubscribe = getMessagesStream(
      user.uid,
      characterId, 
      (rtdbMessages) => {
        const uiMessages: ChatMessageUI[] = rtdbMessages.map(doc => ({
          id: doc.id, 
          rtdbKey: doc.id,
          sender: doc.sender,
          type: doc.messageType === 'audio' ? 'audio' : doc.messageType === 'video' ? 'video' : 'text',
          content: doc.text,
          characterName: doc.sender === 'ai' ? currentCharacterMeta?.name : undefined,
          timestamp: new Date(doc.timestamp), 
          audioSrc: doc.audioUrl,
          videoSrc: doc.videoUrl,
        }));
        setMessages(uiMessages);
        if(pageLoading) setPageLoading(false);
      },
      50
    );

    return () => unsubscribe();
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

  const handleSendMessage = useCallback(async (userInput: string, requestType?: 'text' | 'audio_request' | 'video_request') => {
    if (!user || !currentCharacterMeta || !currentChatSessionMeta) {
      toast({ title: 'Cannot send message', description: 'User or character not loaded.', variant: 'destructive' });
      return;
    }

    const userMessageData: Omit<MessageDocument, 'timestamp'> = {
      sender: 'user',
      text: userInput,
      messageType: 'text', 
    };
    
    addOptimisticMessage({
      sender: 'user',
      type: 'text',
      content: userInput,
    });
    setIsLoadingMessage(true);
    setCurrentVideoSrc(undefined);

    try {
      await addMessageToChat(user.uid, characterId, userMessageData);

      const optimisticAiLoadingId = addOptimisticMessage({
        sender: 'ai',
        type: 'loading',
        content: `${currentCharacterMeta.name} is typing… kuch romantic hi hoga 💖`,
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
        characterId 
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

  return (
    <div className="flex flex-col h-screen overflow-hidden"> 
      <Header />
      <div className="bg-card/80 backdrop-blur-sm shadow-md p-3 border-b border-border sticky top-16 md:top-18 z-40">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-primary hover:bg-primary/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                </Button>
                <h2 className="text-xl font-headline text-primary">{currentCharacterMeta.name}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleFavoriteChat} className="text-primary hover:bg-primary/10 rounded-full" title={isFavorite ? "Unfavorite Chat" : "Favorite Chat"}>
                <Star className={`h-6 w-6 transition-colors duration-200 ${isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
            </Button>
        </div>
      </div>

      <main className="flex-grow overflow-hidden">
        <ChatLayout
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoadingMessage}
          currentCharacterName={currentCharacterMeta.name as CharacterName}
          currentCharacterAvatar={currentCharacterMeta.avatarUrl} 
          currentVideoMessageSrc={currentVideoSrc}
          characterMessageBubbleStyle={currentCharacterMeta.messageBubbleStyle}
        />
      </main>
      <div ref={messagesEndRef} />
    </div>
  );
}
