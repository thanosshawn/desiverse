
// src/components/chat/chat-page-header.tsx
'use client';

import React from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'; 
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, MoreVertical } from 'lucide-react';
import { BondMeter } from '@/components/chat/bond-meter';
import type { CharacterMetadata, UserChatStreakData } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatPageHeaderProps {
  characterMeta: CharacterMetadata;
  isFavorite: boolean;
  toggleFavoriteChat: () => void;
  bondPercentage: number;
  currentStreakData: UserChatStreakData | null; 
  router: AppRouterInstance; 
}

export function ChatPageHeader({
  characterMeta,
  isFavorite,
  toggleFavoriteChat,
  bondPercentage,
  currentStreakData, 
  router,
}: ChatPageHeaderProps) {
  return (
    <div className="bg-card/80 backdrop-blur-md shadow-lg border-b border-border/30 sticky top-16 md:top-18 z-40">
      <div className="container mx-auto flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-primary hover:bg-primary/10 rounded-full flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {/* Avatar visible on mobile, hidden on md+ where it's in the sidebar */}
          <Avatar className="h-9 w-9 rounded-lg border border-primary/20 md:hidden flex-shrink-0">
            <AvatarImage src={characterMeta.avatarUrl} alt={characterMeta.name}/>
            <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xs">{getInitials(characterMeta.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-lg font-headline text-primary truncate">{characterMeta.name}</h2>
            <p className="text-xs text-muted-foreground truncate">{characterMeta.personalitySnippet}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFavoriteChat} 
            className="text-primary hover:bg-primary/10 rounded-full" 
            title={isFavorite ? "Unfavorite Chat" : "Favorite Chat"}
          >
            <Star className={`h-6 w-6 transition-colors duration-200 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                <MoreVertical className="h-5 w-5"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-border/30 bg-card">
              <DropdownMenuItem onClick={() => router.push('/')} className="cursor-pointer focus:bg-primary/10">Change Character</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-primary/10">Report (Coming Soon)</DropdownMenuItem>
              {/* Add more actions here if needed */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <BondMeter
        characterName={characterMeta.name}
        bondPercentage={bondPercentage}
        streakData={currentStreakData} 
      />
    </div>
  );
}
