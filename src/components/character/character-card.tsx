
// src/components/character/character-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Sparkles, Gem } from 'lucide-react'; 
import type { CharacterMetadata } from '@/lib/types';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';
import React from 'react';
import { cn } from '@/lib/utils';

interface CharacterCardProps {
  character: CharacterMetadata;
  user: User | null;
  tagColors: Record<string, string>;
}

const CharacterCardComponent = ({ character, user, tagColors }: CharacterCardProps) => {
  const isValidAvatarUrl = character.avatarUrl && (character.avatarUrl.startsWith('http') || character.avatarUrl.startsWith('data:'));
  const avatarSrc = isValidAvatarUrl ? character.avatarUrl : DEFAULT_AVATAR_DATA_URI;

  return (
    <Card
        key={character.id}
        className="bg-card shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl overflow-hidden flex flex-col group animate-fade-in border border-border"
    >
      <CardHeader className="p-0 relative w-full aspect-[3/4.2] group-hover:shadow-glow-primary transition-shadow duration-300">
        <Image
          src={avatarSrc}
          alt={character.name}
          fill
          className="object-cover group-hover:brightness-110 transition-all duration-300 ease-in-out transform group-hover:scale-105"
          data-ai-hint={character.dataAiHint || 'indian person portrait'}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 23vw"
          priority={character.id === 'priya_sharma_abcd'} 
        />
        {character.isPremium && (
          <Badge variant="default" className="absolute top-3.5 right-3.5 bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-lg animate-heartbeat px-3 py-1.5 text-xs border border-yellow-600/70 rounded-lg">
            <Gem className="w-4 h-4 mr-1.5 text-black/70" /> Premium
          </Badge>
        )}
         <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
            <CardTitle className="text-2xl text-white mb-0.5 font-headline drop-shadow-md">{character.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5 text-center flex flex-col flex-grow">
        <CardDescription className="text-sm text-muted-foreground mb-3.5 flex-grow min-h-[3em] line-clamp-2">{character.personalitySnippet}</CardDescription>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {character.styleTags.slice(0, 3).map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={cn(
                "text-xs px-3 py-1.5 rounded-full font-medium border-current shadow-sm",
                tagColors[tag] ? `text-white ${tagColors[tag].replace('hover:', 'bg-opacity-70 ')} border-transparent` : "border-primary/40 text-primary bg-primary/10"
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <Link href={user ? `/chat/${character.id}` : `/login?redirect=/chat/${character.id}`} passHref className="mt-auto">
          <Button
            variant="default"
            className="w-full text-primary-foreground rounded-xl text-base py-3.5 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 group-hover:shadow-glow-primary bg-gradient-to-r from-primary via-rose-500 to-pink-600 hover:from-primary/90 hover:via-rose-500/90 hover:to-pink-600/90"
          >
            <MessageCircle className="mr-2 h-5 w-5" /> Chat Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export const CharacterCard = React.memo(CharacterCardComponent);
