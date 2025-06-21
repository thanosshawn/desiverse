
// src/app/groups/[groupId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { Loader2, Users, ArrowLeft, SendHorizonal } from 'lucide-react';
import type { GroupChatMetadata, GroupChatMessageUI } from '@/lib/types';
import { getGroupChatMetadata, getGroupMessagesStream } from '@/lib/firebase/rtdb';
import { handleGroupUserMessage } from '../actions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';

const GroupChatMessage = React.memo(({ message, currentUserId, currentUserAvatar, currentUserDisplayName }: { message: GroupChatMessageUI; currentUserId: string; currentUserAvatar?: string | null; currentUserDisplayName?: string | null; }) => {
  const isCurrentUser = message.senderId === currentUserId;
  
  const bubbleAlignment = isCurrentUser ? 'justify-end self-end ml-auto pl-[10%]' : 'justify-start self-start mr-auto pr-[10%]';
  
  const bubbleStyles = cn(
    'p-3 md:p-3.5 rounded-2xl shadow-md break-words text-sm md:text-base max-w-full',
    {
      'bg-gradient-to-br from-primary via-rose-500 to-pink-600 text-primary-foreground rounded-tr-lg': isCurrentUser,
      'bg-gradient-to-tr from-card via-muted/70 to-card text-card-foreground rounded-tl-lg border border-border/60': !isCurrentUser,
    }
  );

  return (
    <div className={cn('flex items-end space-x-2.5 group animate-fade-in w-full', bubbleAlignment)}>
      {!isCurrentUser && (
         <Avatar className="flex-shrink-0 self-end mb-1 w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md border-2 border-accent/40">
            <AvatarImage src={message.senderAvatarUrl || undefined} alt={message.senderName} />
            <AvatarFallback className="bg-accent/20 text-accent text-sm font-semibold">
              {getInitials(message.senderName)}
            </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col w-full">
         {!isCurrentUser && (
          <p className="text-xs text-muted-foreground ml-2 mb-0.5">{message.senderName}</p>
        )}
        <div className={bubbleStyles}>
           <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-0 last:mb-0 leading-relaxed" {...props} /> }}>
                {message.text}
            </ReactMarkdown>
        </div>
      </div>
       {isCurrentUser && (
         <Avatar className="flex-shrink-0 self-end mb-1 w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md border-2 border-secondary/40">
            <AvatarImage src={currentUserAvatar || undefined} alt={currentUserDisplayName || 'Me'} />
            <AvatarFallback className="bg-secondary/20 text-secondary-foreground text-sm font-semibold">
              {getInitials(currentUserDisplayName || 'Me')}
            </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
GroupChatMessage.displayName = 'GroupChatMessage';


function GroupChatPageComponent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const { toast } = useToast();

  const [group, setGroup] = useState<GroupChatMetadata | null>(null);
  const [messages, setMessages] = useState<GroupChatMessageUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/groups/${groupId}`);
      return;
    }

    if (groupId) {
      getGroupChatMetadata(groupId).then(meta => {
        if (meta) {
          setGroup(meta);
        } else {
          toast({ title: 'Group Not Found', variant: 'destructive' });
          router.push('/groups');
        }
        setIsLoading(false);
      });
    }
  }, [groupId, user, authLoading, router, toast]);

  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = getGroupMessagesStream(groupId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [groupId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (messageText: string) => {
    if (!user || !userProfile || isSending || !messageText.trim()) return;
    setIsSending(true);
    setInput('');

    const result = await handleGroupUserMessage(
      groupId,
      user.uid,
      userProfile.name || user.displayName || 'Anonymous',
      userProfile.avatarUrl || user.photoURL,
      messageText
    );

    if (!result.success) {
      toast({ title: 'Error sending message', description: result.error, variant: 'destructive' });
      setInput(messageText); // Restore input on failure
    }
    setIsSending(false);
  };
  
  if (isLoading || authLoading) {
     return (
       <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Header />
        <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
        <p className="text-lg mt-2 text-muted-foreground">Loading Group Chat...</p>
      </div>
    );
  }

  if (!group) {
     return (
       <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Header />
        <p className="text-lg mt-2 text-muted-foreground">Group not found.</p>
        <Link href="/groups" className="mt-4"><Button>Back to Groups</Button></Link>
      </div>
    );
  }
  

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />
      {/* Group Chat Header */}
      <div className="bg-card shadow-lg border-b border-border sticky top-16 md:top-18 z-40 px-3 py-2.5">
          <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                  <Button variant="ghost" size="icon" onClick={() => router.push('/groups')} className="text-primary hover:bg-primary/10 rounded-full flex-shrink-0">
                      <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex -space-x-2 overflow-hidden items-center mr-2">
                    {group.hostCharacterSnapshots?.slice(0, 3).map(host => (
                        <Avatar key={host.id} className="h-9 w-9 border-2 border-card rounded-full">
                           <AvatarImage src={host.avatarUrl} />
                           <AvatarFallback>{getInitials(host.name)}</AvatarFallback>
                        </Avatar>
                    ))}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                      <h2 className="text-lg font-headline text-primary truncate">{group.title}</h2>
                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                  </div>
              </div>
               <div className="flex items-center text-muted-foreground text-sm">
                  <Users className="h-4 w-4 mr-1.5"/> {group.participantCount || 0}
               </div>
          </div>
      </div>
      
      {/* Messages Area */}
      <ScrollArea className="flex-grow">
          <div className="space-y-3 p-4 md:p-6">
              {messages.map(msg => (
                <GroupChatMessage 
                    key={msg.id} 
                    message={msg} 
                    currentUserId={user!.uid} 
                    currentUserAvatar={userProfile?.avatarUrl || user?.photoURL}
                    currentUserDisplayName={userProfile?.name || user?.displayName}
                />
              ))}
          </div>
          <div ref={messagesEndRef} />
      </ScrollArea>
      
      {/* Input Area */}
      <div className="p-3 md:p-4 border-t border-border bg-card">
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
            }}
            className="flex items-end space-x-2"
        >
            <Textarea
                name="message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(input);
                    }
                }}
                placeholder={`Message in #${group.title}...`}
                className="flex-grow resize-none max-h-28 p-3 rounded-xl shadow-inner bg-background border-border text-sm md:text-base focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={isSending}
                autoComplete="off"
                rows={1}
            />
            <Button 
                type="submit" 
                disabled={isSending || !input.trim()} 
                size="icon"
                className="bg-gradient-to-br from-primary via-rose-500 to-pink-600 hover:shadow-glow-primary text-primary-foreground rounded-xl p-3 aspect-square shadow-lg transform transition-transform hover:scale-105 focus:ring-2 ring-primary ring-offset-2 ring-offset-background h-12 w-12 md:h-[52px] md:w-[52px]"
                title="Send message"
            >
              {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <SendHorizonal className="h-5 w-5" />}
            </Button>
        </form>
      </div>

    </div>
  );
}


export default function GroupChatRoomPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Header />
        <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
        <p className="text-lg mt-2 text-muted-foreground">Loading...</p>
      </div>
    }>
      <GroupChatPageComponent />
    </Suspense>
  )
}
