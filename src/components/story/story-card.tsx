
// src/components/story/story-card.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { InteractiveStory, CharacterMetadata } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface StoryCardProps {
  story: InteractiveStory;
  character?: CharacterMetadata; 
  tagColors: Record<string, string>;
}

const StoryCardComponent = ({ story, character, tagColors }: StoryCardProps) => {
  const { user } = useAuth();

  const coverImageSrc = story.coverImageUrl || `https://placehold.co/600x338.png?text=${encodeURIComponent(story.title)}&font=baloo`;
  const characterDisplayName = story.characterNameSnapshot || character?.name || 'Mysterious Bae';

  return (
    <Card
      className="bg-card/85 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.035] transition-transform duration-300 flex flex-col group hover:shadow-primary/40 animate-fade-in border-2 border-transparent hover:border-primary/30"
    >
      <CardHeader className="p-0 relative w-full aspect-[16/9.5] group-hover:shadow-glow-primary transition-shadow duration-300">
        <Image
          src={coverImageSrc}
          alt={story.title}
          fill
          className="object-cover group-hover:brightness-105 transition-all duration-300 ease-in-out transform group-hover:scale-105"
          data-ai-hint={story.tags?.slice(0,2).join(' ') || 'story cover adventure romance'}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-6">
          <CardTitle className="text-xl text-white mb-0.5 font-headline line-clamp-2 drop-shadow-md">{story.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex flex-col flex-grow">
        <CardDescription className="text-sm text-muted-foreground mb-2.5 line-clamp-3 flex-grow min-h-[3.5em]">{story.description}</CardDescription>
        <p className="text-xs text-muted-foreground/80 mb-3.5">
          Starring: <span className="font-semibold text-accent">{characterDisplayName}</span>
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {story.tags?.slice(0, 4).map(tag => (
            <Badge
              key={tag}
              variant="default"
              className={cn(
                "text-xs px-3 py-1.5 rounded-full font-medium shadow-sm",
                tagColors[tag] || 'bg-secondary text-secondary-foreground',
                (tag === 'Comedy' || tag === 'Spiritual' || tag === 'Hinglish' || tag === 'Foodie' || tag === 'Adventure') ? 'text-black' : 'text-primary-foreground'
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <Link href={user ? `/story/${story.id}` : `/login?redirect=/story/${story.id}`} passHref className="mt-auto">
          <Button
            variant="default"
            className="w-full text-primary-foreground rounded-xl text-base py-3.5 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 group-hover:shadow-glow-primary bg-gradient-to-r from-primary via-rose-500 to-pink-600 hover:from-primary/90 hover:via-rose-500/90 hover:to-pink-600/90"
            aria-label={`Play story: ${story.title}`}
          >
            <BookHeart className="mr-2 h-5 w-5" /> Play Story
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export const StoryCard = React.memo(StoryCardComponent);
