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
  addMessageToChat 
} from '@/lib/firebase/rtdb'; 
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Dynamic background style based on character metadata
  const backgroundStyle = currentCharacterMeta?.backgroundImageUrl
    ? { 
        backgroundImage: `url(${currentCharacterMeta.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {};

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to chat.', variant: 'destructive' });
      router.push('/');
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
        content: `${currentCharacterMeta.name} is typing...`,
        characterName: currentCharacterMeta.name as CharacterName,
      });

      // Pass the full currentCharacterMeta to the action
      const aiResponse = await handleUserMessageAction(
        userInput,
        messages.filter(m => m.type !== 'loading' && m.type !== 'error').map(m => ({
            id: m.rtdbKey || m.id, 
            sender: m.sender,
            content: m.content, 
            timestamp: m.timestamp.getTime(), 
        })).slice(-10), 
        currentCharacterMeta, // Pass full metadata
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
          audioUrl: aiResponse.audioDataUri,
          videoUrl: aiResponse.videoDataUri,
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

  if (authLoading || pageLoading || !currentCharacterMeta || !currentChatSessionMeta) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground items-center justify-center" style={backgroundStyle}>
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground bg-background/80 p-2 rounded-md">Loading your chat with {currentCharacterMeta?.name || characterId || 'your Bae'}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground" style={backgroundStyle}>
      <Header />
      <main className="flex-grow overflow-hidden">
        <ChatLayout
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoadingMessage}
          currentCharacterName={currentCharacterMeta.name as CharacterName}
          currentCharacterAvatar={currentCharacterMeta.avatarUrl} // This will be the Supabase URL
          currentVideoMessageSrc={currentVideoSrc}
        />
      </main>
      <div ref={messagesEndRef} />
    </div>
  );
}
