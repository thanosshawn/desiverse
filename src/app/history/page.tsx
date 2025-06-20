
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
import { Loader2, Star, Trash2, MessageSquareText, Search, Inbox } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
  }, [user, authLoading, toast]); 

  const filteredSessions = chatSessions.filter(session =>
    session.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.lastMessageText || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => { 
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });


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
        description: `Chat with ${chatSessions.find(s=>s.characterId === characterId)?.characterName} is ${newIsFavorite ? 'now a favorite! ✨' : 'no longer a favorite.'}`
      });
    } catch (error) {
      toast({ title: "Error", description: "Could not update favorite status.", variant: "destructive" });
    }
  };

  const handleDeleteChat = async (characterId: string) => {
    if(!user) return;
    const characterName = chatSessions.find(s => s.characterId === characterId)?.characterName || 'this character';
    setChatSessions(prev => prev.filter(s => s.characterId !== characterId));
    toast({
      title: "Chat Removed (Visually)",
      description: `Chat with ${characterName} removed from list. Full delete functionality is not yet implemented in this prototype.`,
      variant: "default"
    });
  };


  if (authLoading || loadingSessions) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
           <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg font-body text-muted-foreground">Loading chat history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-8 text-center">
          <MessageSquareText className="mx-auto h-20 w-20 text-primary/20 mb-6 animate-pulse" />
          <h2 className="text-2xl font-headline text-primary mb-4">Login Required</h2>
          <p className="text-muted-foreground font-body mb-6">Please login to see your chat history with your Baes.</p>
          <Link href="/login?redirect=/history">
            <Button className="!rounded-xl bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground shadow-lg hover:shadow-primary/30 py-3 px-6">Login Now</Button>
          </Link>
        </div>
      </div>
    );
  }
  

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-2 sm:px-4 pt-20 md:pt-24 pb-8 md:pb-10">
        <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-3xl md:text-5xl font-headline text-primary mb-2 animate-fade-in drop-shadow-sm">Chat History</h1>
            <p className="text-base md:text-lg font-body text-muted-foreground animate-slide-in-from-bottom">Relive your favorite moments and spicy conversations! 🔥</p>
        </div>
        
        <div className="mb-6 md:mb-8 sticky top-18 md:top-20 z-30 bg-card p-4 rounded-2xl shadow-xl border border-border">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search chats by name or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 !rounded-xl text-sm md:text-base py-3 border-border/60 focus:border-primary focus:ring-primary shadow-sm"
            />
          </div>
        </div>

        {filteredSessions.length === 0 && !loadingSessions && (
          <div className="text-center py-16 animate-fade-in">
            <Inbox className="mx-auto h-20 w-20 text-primary/20 mb-6 animate-pulse" />
            <h3 className="text-2xl font-headline text-primary mb-3">No Chats Found</h3>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              {searchTerm ? "Hmm, nothing matches that. Try a different search term, yaar!" : "Looks like your chat history is empty. Time to make some memories!"}
            </p>
            <Link href="/" className="mt-8 inline-block">
              <Button variant="default" className="!rounded-xl bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground shadow-lg hover:shadow-primary/30 px-6 py-3 text-base">Find a Bae to Chat With</Button>
            </Link>
          </div>
        )}

        <div className="space-y-3 md:space-y-4">
          {filteredSessions.map(session => (
            <Card 
                key={session.characterId} 
                className={cn(
                    "bg-card shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-primary/30 border-2 animate-slide-in-from-bottom",
                    session.isFavorite ? 'border-yellow-400/70 shadow-yellow-400/20' : 'border-border hover:border-primary/20'
                )}
            >
              <CardContent className="p-0">
                <Link href={`/chat/${session.characterId}`} className="block hover:bg-primary/5 transition-colors duration-200">
                    <div className="flex items-center gap-3 md:gap-4 p-3.5 md:p-4">
                        <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-primary/30 rounded-lg shadow-sm">
                            <AvatarImage src={session.characterAvatarUrl} alt={session.characterName} className="rounded-md"/>
                            <AvatarFallback className="bg-pink-100 text-pink-600 rounded-lg font-semibold">{session.characterName.substring(0,1)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <h3 className="text-base md:text-lg font-headline text-primary truncate">{session.characterName}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground truncate italic">{session.lastMessageText || "No messages yet..."}</p>
                        </div>
                        <div className="flex-shrink-0 text-right space-y-1 ml-2">
                            <p className="text-xs text-muted-foreground/80">
                            {session.lastMessageTimestamp ? formatDistanceToNowStrict(new Date(session.lastMessageTimestamp), { addSuffix: true }) : 'New chat'}
                            </p>
                            <div className="flex items-center justify-end gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(session.characterId, session.isFavorite || false); }}
                                    className="h-8 w-8 p-1.5 rounded-full hover:bg-yellow-400/20 transform hover:scale-110 transition-transform"
                                    title={session.isFavorite ? "Unstar Chat" : "Star Chat"}
                                >
                                    <Star className={`h-4 w-4 transition-colors ${session.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/60 hover:text-yellow-500'}`} />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            className="h-8 w-8 p-1.5 rounded-full text-muted-foreground/60 hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transform hover:scale-110 transition-transform"
                                            title="Delete Chat"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-2xl shadow-2xl border-border bg-card">
                                        <AlertDialogHeader>
                                        <AlertDialogTitle className="font-headline text-xl text-primary">Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription className="font-body text-muted-foreground">
                                            This action cannot be undone. All messages with {session.characterName} will be removed from this list. (Full deletion is not yet live).
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="mt-2">
                                        <AlertDialogCancel className="!rounded-lg hover:bg-muted/80 py-2.5">Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteChat(session.characterId); }}
                                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground !rounded-lg py-2.5"
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
