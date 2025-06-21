
// src/components/home/daily-message-card.tsx
import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { UserChatSessionMetadata } from '@/lib/types';
import { Mail, MessageCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface DailyMessageCardProps {
  isLoading: boolean;
  message: string | null;
  character: UserChatSessionMetadata | null;
}

export function DailyMessageCard({ isLoading, message, character }: DailyMessageCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 border-2 border-primary/20 shadow-2xl rounded-3xl p-1 animate-pulse">
        <Skeleton className="w-full h-[150px] rounded-[1.25rem] bg-card/50" />
      </Card>
    );
  }

  if (!message || !character) {
    return null; // Don't render the card if there's no message or character
  }

  return (
    <Card className="bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 border-2 border-primary/30 shadow-2xl rounded-3xl p-1 animate-fade-in">
      <div className="bg-card/80 backdrop-blur-sm rounded-[1.25rem] p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
        <div className="flex-shrink-0 flex flex-col items-center">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/50 shadow-lg rounded-2xl">
            <AvatarImage src={character.characterAvatarUrl} alt={character.characterName} />
            <AvatarFallback className="text-3xl bg-pink-100 text-pink-600 rounded-xl">
              {getInitials(character.characterName)}
            </AvatarFallback>
          </Avatar>
           <p className="mt-2 text-sm font-headline text-primary text-center">{character.characterName}</p>
        </div>
        <div className="flex-grow text-center sm:text-left">
          <h3 className="text-lg font-headline text-accent flex items-center justify-center sm:justify-start">
             <Mail className="w-5 h-5 mr-2" /> A Message For You...
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground my-2 font-body text-base">
            <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-0 last:mb-0" {...props} /> }}>
                {`"${message}"`}
            </ReactMarkdown>
          </div>
          <Link href={`/chat/${character.characterId}`} passHref className="mt-3 inline-block">
            <Button
              variant="default"
              className="!rounded-xl bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground shadow-lg hover:shadow-primary/30 transform hover:scale-105 transition-transform"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Reply Now
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
