
// src/components/chat/bond-meter.tsx
'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Heart, Sparkles, Gift, Users } from 'lucide-react'; // Added more icons

interface BondMeterProps {
  characterName: string;
  bondPercentage: number;
}

const getBondStage = (percentage: number): { stage: string; icon: React.ElementType; colorClass: string } => {
  if (percentage <= 25) return { stage: 'Crush', icon: Heart, colorClass: 'text-pink-400' };
  if (percentage <= 50) return { stage: 'Friend', icon: Users, colorClass: 'text-blue-400' };
  if (percentage <= 75) return { stage: 'Close Friend', icon: Sparkles, colorClass: 'text-yellow-400' };
  return { stage: 'Soulmate', icon: Gift, colorClass: 'text-red-500' }; // Gift for Soulmate, like a precious bond
};

export function BondMeter({ characterName, bondPercentage }: BondMeterProps) {
  const { stage, icon: StageIcon, colorClass } = getBondStage(bondPercentage);
  const displayPercentage = Math.max(0, Math.min(100, Math.round(bondPercentage)));

  return (
    <div className="w-full px-3 py-2 space-y-1.5 bg-card/50 rounded-b-lg shadow-sm">
      <div className="flex items-center justify-between text-xs font-medium">
        <div className="flex items-center">
          <Heart className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
          <span className="text-muted-foreground">Bond with {characterName}:</span>
          <span className="ml-1.5 font-semibold text-primary">{displayPercentage}%</span>
        </div>
        <div className={`flex items-center ${colorClass}`}>
          <StageIcon className="w-3.5 h-3.5 mr-1" />
          <span>{stage}</span>
        </div>
      </div>
      <Progress value={displayPercentage} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-pink-400 [&>div]:via-rose-400 [&>div]:to-orange-400" />
    </div>
  );
}

