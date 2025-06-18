// src/app/chat/[characterId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ChatLayout } from '@/components/chat/chat-layout';
import type { ChatMessageUI, CharacterMetadata, ChatSession, MessageDocument, CharacterName } from '@/lib/types';
import { handleUserMessageAction } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCharacterMetadata, getOrCreateChatSession, getMessagesStream, addMessageToChat } from '@/lib/firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Polyfill for crypto.randomUUID in environments where it might be missing (like older Node for SSR tests)
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
  const [isLoadingMessage, setIsLoadingMessage] = useState(false); // For AI response loading
  const [pageLoading, setPageLoading] = useState(true); // For initial page and data load
  
  const [currentCharacterMeta, setCurrentCharacterMeta] = useState<CharacterMetadata | null>(null);
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | undefined>(undefined);

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Effect for initial auth check and data fetching
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to chat.', variant: 'destructive' });
      router.push('/'); // Redirect to homepage or a login page
      return;
    }

    if (!characterId) {
      toast({ title: 'Character Not Specified', description: 'Please select a character to chat with.', variant: 'destructive' });
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

        const chatSession = await getOrCreateChatSession(user.uid, characterId);
        setCurrentChatSession(chatSession);
        // Initial messages will be loaded by the stream listener
      } catch (error: any) {
        console.error("Error initializing chat:", error);
        toast({ title: 'Error Initializing Chat', description: error.message, variant: 'destructive' });
        router.push('/');
      } finally {
        // Page loading will be set to false after the first message stream callback
      }
    };

    initializeChat();
  }, [user, authLoading, characterId, router, toast]);


  // Effect for streaming messages
  useEffect(() => {
    if (!user || !currentChatSession) return;

    const unsubscribe = getMessagesStream(
      user.uid,
      currentChatSession.id, // This is effectively characterId if using that as chatID
      (firestoreMessages) => {
        const uiMessages: ChatMessageUI[] = firestoreMessages.map(doc => ({
          id: doc.id || crypto.randomUUID(), // Use doc.id from Firestore
          firestoreDocId: doc.id,
          sender: doc.sender,
          type: doc.messageType === 'audio' ? 'audio' : doc.messageType === 'video' ? 'video' : 'text',
          content: doc.text,
          characterName: doc.sender === 'ai' ? currentCharacterMeta?.name : undefined,
          timestamp: (doc.timestamp as Timestamp)?.toDate() || new Date(),
          audioSrc: doc.audioUrl,
          videoSrc: doc.videoUrl,
        }));
        setMessages(uiMessages);
        if(pageLoading) setPageLoading(false); // Stop page loading after first messages arrive
      },
      50 // Load last 50 messages
    );

    return () => unsubscribe();
  }, [user, currentChatSession, currentCharacterMeta?.name, pageLoading]);


  const addOptimisticMessage = (message: Omit<ChatMessageUI, 'id' | 'timestamp' | 'firestoreDocId'>): string => {
    const optimisticId = crypto.randomUUID();
    const optimisticMessage: ChatMessageUI = {
      ...message,
      id: optimisticId,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    return optimisticId;
  };

  const updateOptimisticMessage = (optimisticId: string, confirmedMessage: Partial<ChatMessageUI> & { firestoreDocId: string }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === optimisticId ? { ...msg, ...confirmedMessage, id: confirmedMessage.firestoreDocId } : msg
    ));
  };

  const removeOptimisticMessage = (optimisticId: string) => {
     setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
  };


  const handleSendMessage = useCallback(async (userInput: string, requestType?: 'text' | 'audio_request' | 'video_request') => {
    if (!user || !currentCharacterMeta || !currentChatSession) {
      toast({ title: 'Cannot send message', description: 'User or character not loaded.', variant: 'destructive' });
      return;
    }

    const userMessageData: Omit<MessageDocument, 'timestamp' | 'id'> = {
      chatId: currentChatSession.id,
      sender: 'user',
      text: userInput,
      messageType: 'text',
    };
    
    const optimisticUserMessageId = addOptimisticMessage({
      sender: 'user',
      type: 'text',
      content: userInput,
      characterName: undefined, // User message has no AI character name
    });
    setIsLoadingMessage(true);
    setCurrentVideoSrc(undefined);

    try {
      // Save user message to Firestore
      const userMessageFirestoreId = await addMessageToChat(user.uid, currentChatSession.id, userMessageData);
      updateOptimisticMessage(optimisticUserMessageId, { firestoreDocId: userMessageFirestoreId, content: userInput });


      const optimisticAiLoadingId = addOptimisticMessage({
        sender: 'ai',
        type: 'loading',
        content: `${currentCharacterMeta.name} is typing...`,
        characterName: currentCharacterMeta.name as CharacterName,
      });

      // Call AI action
      const aiResponse = await handleUserMessageAction(
        userInput,
        messages.filter(m => m.type !== 'loading' && m.type !== 'error').map(m => ({ // Pass history of actual messages
            id: m.firestoreDocId || m.id,
            sender: m.sender,
            type: m.type,
            content: m.content,
            character: m.characterName,
            timestamp: m.timestamp,
            audioSrc: m.audioSrc,
            videoSrc: m.videoSrc,
        })), // This needs to be adjusted to pass MessageDocument-like structure if action expects it
        currentCharacterMeta, // Pass full metadata
        user.uid,
        currentChatSession.id
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
        const aiMessageData: Omit<MessageDocument, 'timestamp' | 'id'> = {
          chatId: currentChatSession.id,
          sender: 'ai',
          text: aiResponse.text,
          messageType: aiResponse.videoDataUri ? 'video' : aiResponse.audioDataUri ? 'audio' : 'text',
          audioUrl: aiResponse.audioDataUri,
          videoUrl: aiResponse.videoDataUri,
        };
        await addMessageToChat(user.uid, currentChatSession.id, aiMessageData);
        // Message will appear via Firestore stream. Optimistic update for AI message already handled by stream.
        
        if (aiResponse.videoDataUri) {
          setCurrentVideoSrc(aiResponse.videoDataUri);
        }
      }
    } catch (error: any) {
      console.error("Send message error:", error);
      removeOptimisticMessage(messages.find(m => m.type === 'loading')?.id || ''); // Remove any loading message
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
  }, [user, currentCharacterMeta, currentChatSession, messages, toast]);

  if (authLoading || pageLoading || !currentCharacterMeta) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground items-center justify-center">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading your chat with {characterId || 'your Bae'}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow overflow-hidden">
        <ChatLayout
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoadingMessage}
          currentCharacterName={currentCharacterMeta.name as CharacterName}
          currentCharacterAvatar={currentCharacterMeta.avatarUrl}
          currentVideoMessageSrc={currentVideoSrc}
        />
      </main>
      <div ref={messagesEndRef} />
    </div>
  );
}
