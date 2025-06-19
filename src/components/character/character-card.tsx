
// src/components/character/character-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // CardFooter removed
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';
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
        className="bg-card/80 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.03] transition-transform duration-300 flex flex-col group hover:shadow-primary/40 animate-fade-in border-2 border-transparent hover:border-primary/30"
    >
      <CardHeader className="p-0 relative w-full aspect-[3/4] group-hover:shadow-glow-primary transition-shadow duration-300">
        <Image
          src={avatarSrc}
          alt={character.name}
          fill
          className="object-cover group-hover:brightness-110 transition-all duration-300 ease-in-out"
          data-ai-hint={character.dataAiHint || 'indian person portrait'}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 23vw"
          priority={character.id === 'priya_sharma_abcd'} // Example: prioritize first character or based on logic
        />
        {character.isPremium && (
          <Badge variant="default" className="absolute top-3 right-3 bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-lg animate-heartbeat px-2.5 py-1 text-xs border border-yellow-600">
            <Gem className="w-3.5 h-3.5 mr-1.5 text-black/70" /> Premium
          </Badge>
        )}
         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
            <CardTitle className="text-2xl text-white mb-0.5 font-headline drop-shadow-lg">{character.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5 text-center flex flex-col flex-grow">
        <CardDescription className="text-sm text-muted-foreground mb-3 flex-grow min-h-[3em] line-clamp-2">{character.personalitySnippet}</CardDescription>
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {character.styleTags.slice(0, 3).map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium border-current",
                tagColors[tag] ? `text-white ${tagColors[tag].replace('hover:', 'bg-opacity-70 ')}` : "border-primary/50 text-primary bg-primary/10"
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <Link href={user ? `/chat/${character.id}` : `/login?redirect=/chat/${character.id}`} passHref className="mt-auto">
          <Button
            variant="default"
            className="w-full text-primary-foreground rounded-xl text-base py-3 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 group-hover:shadow-glow-primary bg-gradient-to-r from-primary via-rose-500 to-pink-600 hover:from-primary/90 hover:via-rose-500/90 hover:to-pink-600/90"
          >
            <MessageCircle className="mr-2 h-5 w-5" /> Chat Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export const CharacterCard = React.memo(CharacterCardComponent);
