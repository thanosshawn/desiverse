// src/app/history/page.tsx - Chat History Page
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { getUserChatSessions, updateChatSessionMetadata } from '@/lib/firebase/rtdb';
import type { UserChatSessionMetadata } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Trash2, MessageSquareText, Search } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ChatHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [chatSessions, setChatSessions] = useState<(UserChatSessionMetadata & {characterId: string})[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchChatSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const sessions = await getUserChatSessions(user.uid);
      setChatSessions(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      toast({ title: "Error", description: "Could not load chat history.", variant: "destructive" });
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchChatSessions();
    } else if (!authLoading && !user) {
      setLoadingSessions(false);
    }
  }, [user, authLoading, toast]); // Added toast to dependencies

  const filteredSessions = chatSessions.filter(session =>
    session.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.lastMessageText?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFavorite = async (characterId: string, currentIsFavorite: boolean) => {
    if (!user) return;
    const newIsFavorite = !currentIsFavorite;
    try {
      await updateChatSessionMetadata(user.uid, characterId, { isFavorite: newIsFavorite });
      setChatSessions(prev => 
        prev.map(s => s.characterId === characterId ? {...s, isFavorite: newIsFavorite} : s)
            .sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            })
      );
      toast({
        title: newIsFavorite ? 'Chat Starred ⭐' : 'Chat Unstarred',
        description: `Chat with ${chatSessions.find(s=>s.characterId === characterId)?.characterName} is ${newIsFavorite ? 'now a favorite!' : 'no longer a favorite.'}`
      });
    } catch (error) {
      toast({ title: "Error", description: "Could not update favorite status.", variant: "destructive" });
    }
  };

  const handleDeleteChat = async (characterId: string) => {
    if(!user) return;
    console.log(`Placeholder: Delete chat with ${characterId}`);
    // Note: Full deletion from RTDB is not implemented here, this is visual only for now.
    // To implement full deletion, a new function in rtdb.ts would be needed.
    setChatSessions(prev => prev.filter(s => s.characterId !== characterId));
    toast({
      title: "Chat Removed (Visually)",
      description: `Chat with ${chatSessions.find(s=>s.characterId === characterId)?.characterName} removed from list. Full delete not yet implemented.`,
      variant: "default"
    });
  };


  if (authLoading || loadingSessions) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-headline text-primary mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-6">Please login to see your chat history.</p>
          <Link href="/login?redirect=/history">
            <Button className="!rounded-xl">Login</Button>
          </Link>
        </div>
      </div>
    );
  }
  

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-2 sm:px-4 pt-20 md:pt-22 pb-6 md:pb-8">
        <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-headline text-primary mb-2 animate-fade-in">Chat History</h1>
            <p className="text-muted-foreground font-body animate-slide-in-from-bottom">Relive your favorite moments with your Desi Baes!</p>
        </div>
        
        <div className="mb-6 sticky top-16 md:top-18 z-30 bg-background/80 backdrop-blur-md p-3 rounded-xl shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search chats by name or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 !rounded-lg text-base"
            />
          </div>
        </div>

        {filteredSessions.length === 0 && !loadingSessions && (
          <div className="text-center py-12 animate-fade-in">
            <MessageSquareText className="mx-auto h-16 w-16 text-primary/30 mb-4" />
            <h3 className="text-xl font-headline text-primary mb-2">No Chats Found</h3>
            <p className="text-muted-foreground font-body">
              {searchTerm ? "Try a different search term." : "Looks like your chat history is empty. Start a new chat!"}
            </p>
            <Link href="/" className="mt-6">
              <Button variant="default" className="mt-4 !rounded-xl">Find a Bae</Button>
            </Link>
          </div>
        )}

        <div className="space-y-3 md:space-y-4">
          {filteredSessions.map(session => (
            <Card 
                key={session.characterId} 
                className={`bg-card shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-primary/20 ${session.isFavorite ? 'border-2 border-accent' : 'border-transparent'} animate-slide-in-from-bottom`}
            >
              <CardContent className="p-0">
                <Link href={`/chat/${session.characterId}`} className="block hover:bg-card/50 transition-colors">
                    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
                        <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-primary/30 rounded-lg">
                            <AvatarImage src={session.characterAvatarUrl} alt={session.characterName} className="rounded-md"/>
                            <AvatarFallback className="bg-pink-100 text-pink-600 rounded-lg">{session.characterName.substring(0,1)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <h3 className="text-base md:text-lg font-headline text-primary truncate">{session.characterName}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">{session.lastMessageText || "No messages yet..."}</p>
                        </div>
                        <div className="flex-shrink-0 text-right space-y-1">
                            <p className="text-xs text-muted-foreground">
                            {session.lastMessageTimestamp ? formatDistanceToNowStrict(new Date(session.lastMessageTimestamp), { addSuffix: true }) : 'New chat'}
                            </p>
                            <div className="flex items-center justify-end gap-1">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(session.characterId, session.isFavorite || false); }}
                                    className="h-7 w-7 p-1 rounded-full hover:bg-accent/20"
                                    title={session.isFavorite ? "Unstar Chat" : "Star Chat"}
                                >
                                    <Star className={`h-4 w-4 transition-colors ${session.isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground/70 hover:text-accent'}`} />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            className="h-7 w-7 p-1 rounded-full text-muted-foreground/70 hover:text-destructive hover:border-destructive hover:bg-destructive/10"
                                            title="Delete Chat"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-xl">
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure you want to delete this chat?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. All messages with {session.characterName} will be permanently deleted.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel className="!rounded-lg">Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteChat(session.characterId); }}
                                            className="bg-destructive hover:bg-destructive/90 !rounded-lg"
                                        >
                                            Delete Chat
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
