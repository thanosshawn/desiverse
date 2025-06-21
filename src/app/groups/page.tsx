// src/app/groups/page.tsx - Group Chat Listing Page
'use client';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { Header } from '@/components/layout/header';
import React, { useEffect, useState, Suspense } from 'react';
import type { GroupChatMetadata } from '@/lib/types';
import { getAllGroupChats } from '@/lib/firebase/rtdb';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { GroupCard } from '@/components/group/group-card';
import Link from 'next/link';

function GroupListingContent() {
  const { loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<GroupChatMetadata[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        const fetchedGroups = await getAllGroupChats();
        setGroups(fetchedGroups);
      } catch (error) {
        console.error("Failed to fetch group chats:", error);
        setGroups([]);
      } finally {
        setLoadingData(false);
      }
    }
    if (!authLoading) {
        fetchData();
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
           <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg font-body text-muted-foreground">Loading groups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50 text-foreground">
      <Header />
      <section className="container mx-auto px-4 pt-20 md:pt-24 pb-12 flex-grow">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-3 text-primary animate-fade-in drop-shadow-sm">
            Community <span className="bg-gradient-to-r from-green-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">Group Chats</span>
            <Users className="inline-block text-accent h-10 w-10 ml-2 animate-pulse" />
          </h2>
          <p className="text-lg md:text-xl font-body text-muted-foreground animate-slide-in-from-bottom max-w-2xl mx-auto">
            Join public chat rooms hosted by your favorite Baes. Chat with other fans and make new friends!
          </p>
        </div>

        {loadingData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="bg-card shadow-xl rounded-3xl overflow-hidden aspect-[16/12] flex flex-col border border-border">
                <Skeleton className="w-full h-3/5 bg-muted/30" />
                <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                  <div>
                    <Skeleton className="h-7 w-3/4 mb-2 bg-muted/40" />
                    <Skeleton className="h-12 w-full mb-4 bg-muted/30" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-xl bg-muted/40" />
                </div>
              </Skeleton>
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {groups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="mx-auto h-20 w-20 text-primary/20 mb-6 animate-pulse" />
            <h3 className="text-2xl font-headline text-primary mb-3">No Group Chats Yet! 😟</h3>
            <p className="text-muted-foreground font-body mb-6 max-w-md mx-auto">
              There are no public group chats available right now. Check back soon!
            </p>
             <Link href="/" className="mt-4 ml-2 inline-block">
                <Button variant="default" className="!rounded-xl bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground shadow-lg hover:shadow-primary/30">Chat with Baes</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function GroupListPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <div className="flex-grow flex items-center justify-center p-4">
                     <div className="text-center">
                        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-lg font-body text-muted-foreground">Loading group chats...</p>
                    </div>
                </div>
            </div>
        }>
            <GroupListingContent />
        </Suspense>
    );
}
