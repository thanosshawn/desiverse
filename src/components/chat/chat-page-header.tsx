// src/components/chat/chat-page-header.tsx
'use client';

import React from 'react';
import type { NextRouter } from 'next/router'; // Correct import if using pages router, or 'next/navigation' for app router
import { useRouter as useNextRouter } from 'next/navigation'; // For App Router
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { BondMeter } from '@/components/chat/bond-meter';
import type { CharacterMetadata } from '@/lib/types';

interface ChatPageHeaderProps {
  characterMeta: CharacterMetadata;
  isFavorite: boolean;
  toggleFavoriteChat: () => void;
  bondPercentage: number;
  router: ReturnType<typeof useNextRouter>; // Use the App Router's router type
}

export function ChatPageHeader({
  characterMeta,
  isFavorite,
  toggleFavoriteChat,
  bondPercentage,
  router,
}: ChatPageHeaderProps) {
  return (
    <div className="bg-card/80 backdrop-blur-sm shadow-md border-b border-border sticky top-16 md:top-18 z-40">
      <div className="container mx-auto flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-primary hover:bg-primary/10 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-headline text-primary truncate">{characterMeta.name}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleFavoriteChat} className="text-primary hover:bg-primary/10 rounded-full" title={isFavorite ? "Unfavorite Chat" : "Favorite Chat"}>
          <Star className={`h-6 w-6 transition-colors duration-200 ${isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
        </Button>
      </div>
      <BondMeter
        characterName={characterMeta.name}
        bondPercentage={bondPercentage}
      />
    </div>
  );
}
