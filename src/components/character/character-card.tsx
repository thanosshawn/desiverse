// src/components/character/character-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle } from 'lucide-react';
import type { CharacterMetadata } from '@/lib/types';
import { DEFAULT_AVATAR_DATA_URI } from '@/lib/types';

interface CharacterCardProps {
  character: CharacterMetadata;
  user: User | null;
  tagColors: Record<string, string>;
}

export function CharacterCard({ character, user, tagColors }: CharacterCardProps) {
  const isValidAvatarUrl = character.avatarUrl && (character.avatarUrl.startsWith('http') || character.avatarUrl.startsWith('data:'));
  const avatarSrc = isValidAvatarUrl ? character.avatarUrl : DEFAULT_AVATAR_DATA_URI;

  return (
    <Card key={character.id} className="bg-card shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.03] transition-transform duration-300 flex flex-col group hover:shadow-primary/30 animate-fade-in">
      <CardHeader className="p-0 relative w-full aspect-[3/4]">
        <Image
          src={avatarSrc}
          alt={character.name}
          fill
          className="object-cover group-hover:brightness-110 transition-all duration-300"
          data-ai-hint={character.dataAiHint || 'indian person portrait'}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 23vw"
          priority // Prioritize loading visible character images
        />
        {character.isPremium && (
          <Badge variant="default" className="absolute top-3 right-3 bg-accent text-accent-foreground shadow-md animate-heartbeat">
            <Heart className="w-3 h-3 mr-1.5" /> Premium
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-5 text-center flex flex-col flex-grow">
        <CardTitle className="text-2xl text-primary mb-1.5 font-headline">{character.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-3 flex-grow min-h-[3em] line-clamp-2">{character.personalitySnippet}</CardDescription>
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {character.styleTags.slice(0,3).map(tag => (
              <Badge key={tag} variant="secondary" className={`text-xs px-2 py-0.5 rounded-md ${tagColors[tag]?.replace('bg-', 'bg-opacity-20 border border-').replace('hover:','text-').replace('500','400') || 'bg-secondary/70 text-secondary-foreground'}`}>{tag}</Badge>
          ))}
        </div>
        <Link href={user ? `/chat/${character.id}` : `/login?redirect=/chat/${character.id}`} passHref className="mt-auto">
          <Button variant="default" className="w-full text-primary-foreground rounded-xl text-base py-3 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 group-hover:animate-heartbeat bg-gradient-to-br from-rose-400 via-orange-300 to-amber-300 hover:from-rose-500 hover:via-orange-400 hover:to-amber-400 hover:shadow-orange-500/50">
            <MessageCircle className="mr-2 h-5 w-5" /> Chat with {character.name}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
