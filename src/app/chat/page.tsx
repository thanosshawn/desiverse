'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { ChatLayout } from '@/components/chat/chat-layout';
import type { ChatMessage, CharacterName } from '@/lib/types';
import { handleUserMessageAction } from '../actions'; // Adjusted path
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; 

if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  global.crypto = global.crypto || {} as Crypto; 
  (global.crypto as any).randomUUID = uuidv4;
}

const initialWelcomeMessage: ChatMessage = {
  id: crypto.randomUUID(),
  sender: 'ai',
  type: 'text',
  content: "Namaste! I'm Riya, your Desi Bae. How are you feeling today? ❤️",
  character: 'Riya',
  timestamp: new Date(),
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [currentCharacter] = useState<CharacterName>('Riya'); 
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | undefined>(undefined);


  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages((prev) => [...prev, { ...message, id: crypto.randomUUID(), timestamp: new Date() }]);
  };

  const handleSendMessage = useCallback(async (userInput: string, requestType?: 'text' | 'audio_request' | 'video_request') => {
    addMessage({ sender: 'user', type: 'text', content: userInput });
    setIsLoading(true);
    setCurrentVideoSrc(undefined); 

    const loadingAiMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingAiMessageId,
        sender: 'ai',
        type: 'loading',
        content: 'Riya is typing...',
        character: currentCharacter,
        timestamp: new Date(),
      },
    ]);

    try {
      const aiResponse = await handleUserMessageAction(
        userInput,
        messages,
        currentCharacter,
        requestType
      );

      setMessages(prev => prev.filter(msg => msg.id !== loadingAiMessageId)); 

      if (aiResponse.error) {
        addMessage({ sender: 'ai', type: 'error', content: aiResponse.error, character: currentCharacter });
        toast({
          title: 'AI Error',
          description: aiResponse.error,
          variant: 'destructive',
        });
      } else {
        let messageType: ChatMessage['type'] = 'text';
        let contentForMessageObject = aiResponse.text || "I'm not sure how to respond to that.";
        
        if (aiResponse.videoDataUri) {
          messageType = 'video'; 
          setCurrentVideoSrc(aiResponse.videoDataUri); 
          contentForMessageObject = aiResponse.text || "[Playing video...]";
        } else if (aiResponse.audioDataUri) {
          messageType = 'audio';
           contentForMessageObject = aiResponse.text || "[Playing audio...]";
        }
        
        addMessage({
          sender: 'ai',
          type: messageType,
          content: contentForMessageObject,
          character: currentCharacter,
          audioSrc: aiResponse.audioDataUri,
          videoSrc: messageType === 'video' ? aiResponse.videoDataUri : undefined 
        });
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== loadingAiMessageId));
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      addMessage({ sender: 'ai', type: 'error', content: errorMessage, character: currentCharacter });
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      console.error("Send message error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, currentCharacter, toast]);


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow overflow-hidden">
        <ChatLayout
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentCharacter={currentCharacter}
          currentVideoMessageSrc={currentVideoSrc}
        />
      </main>
    </div>
  );
}
