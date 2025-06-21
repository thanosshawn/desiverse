// src/components/group/group-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { GroupChatMetadata } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, MessageSquarePlus } from 'lucide-react';
import React from 'react';

interface GroupCardProps {
  group: GroupChatMetadata;
}

const GroupCardComponent = ({ group }: GroupCardProps) => {
  const { user } = useAuth();

  const coverImageSrc = group.coverImageUrl || `https://placehold.co/600x338.png?text=${encodeURIComponent(group.title)}&font=baloo`;

  return (
    <Card
      className="bg-card shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl overflow-hidden flex flex-col group animate-fade-in border border-border"
    >
      <CardHeader className="p-0 relative w-full aspect-[16/9.5] group-hover:shadow-glow-primary transition-shadow duration-300">
        <Image
          src={coverImageSrc}
          alt={group.title}
          fill
          className="object-cover group-hover:brightness-105 transition-all duration-300 ease-in-out transform group-hover:scale-105"
          data-ai-hint={'group chat banner'}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-6">
          <CardTitle className="text-xl text-white mb-0.5 font-headline line-clamp-2 drop-shadow-md">{group.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex flex-col flex-grow">
        <CardDescription className="text-sm text-muted-foreground mb-2.5 line-clamp-3 flex-grow min-h-[3.5em]">{group.description}</CardDescription>
        <p className="text-xs text-muted-foreground/80 mb-3.5">
          Hosted by: <span className="font-semibold text-accent">{group.characterNameSnapshot}</span>
        </p>
        <div className="flex items-center text-xs text-muted-foreground mb-4">
            <Users className="w-4 h-4 mr-1.5" /> {group.participantCount || 0} participants
        </div>
        <Link href={user ? `/groups/${group.id}` : `/login?redirect=/groups/${group.id}`} passHref className="mt-auto">
          <Button
            variant="default"
            className="w-full text-primary-foreground rounded-xl text-base py-3.5 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 group-hover:shadow-glow-primary bg-gradient-to-r from-primary via-rose-500 to-pink-600 hover:from-primary/90 hover:via-rose-500/90 hover:to-pink-600/90"
            aria-label={`Join group: ${group.title}`}
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" /> Join Chat
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export const GroupCard = React.memo(GroupCardComponent);
