// src/app/story/[storyId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { InteractiveStory, UserStoryProgress, StoryTurnOutput, CharacterMetadata } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getInteractiveStory, getUserStoryProgress, getCharacterMetadata } from '@/lib/firebase/rtdb';
import { handleStoryChoiceAction } from '../actions';
import { Loader2, Drama, MessageCircle, Send, BookHeart } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import ReactMarkdown from 'react-markdown'; // For rendering AI narration with newlines

function StoryPlayerContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;
  const { toast } = useToast();

  const [story, setStory] = useState<InteractiveStory | null>(null);
  const [storyCharacter, setStoryCharacter] = useState<CharacterMetadata | null>(null);
  const [userProgress, setUserProgress] = useState<UserStoryProgress | null>(null);
  const [currentAiTurn, setCurrentAiTurn] = useState<StoryTurnOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingChoice, setIsProcessingChoice] = useState(false);

  const fetchStoryData = useCallback(async () => {
    if (!storyId || !user) return;
    setIsLoading(true);
    try {
      const storyData = await getInteractiveStory(storyId);
      if (!storyData) {
        toast({ title: 'Error', description: 'Story not found.', variant: 'destructive' });
        router.push('/');
        return;
      }
      setStory(storyData);

      const charData = await getCharacterMetadata(storyData.characterId);
      if (!charData) {
          toast({ title: 'Error', description: 'Character for this story not found.', variant: 'destructive' });
          router.push('/');
          return;
      }
      setStoryCharacter(charData);

      const progressData = await getUserStoryProgress(user.uid, storyId);
      setUserProgress(progressData);

      // Initial AI turn generation
      let initialSummary: string;
      let initialUserChoice: string;

      if (progressData?.currentTurnContext) {
        initialSummary = progressData.currentTurnContext.summaryOfCurrentSituation;
        initialUserChoice = progressData.currentTurnContext.previousUserChoice;
      } else {
        initialSummary = storyData.initialSceneSummary;
        initialUserChoice = "Let's begin the story!";
      }
      
      const aiResponse = await handleStoryChoiceAction(user.uid, userProfile?.name || user.displayName || 'Adventurer', storyId, initialUserChoice);
      if (aiResponse.error || !aiResponse.aiResponse) {
        toast({ title: 'AI Error', description: aiResponse.error || 'Could not start story.', variant: 'destructive' });
      } else {
        setCurrentAiTurn(aiResponse.aiResponse);
        if(aiResponse.nextProgress) setUserProgress(aiResponse.nextProgress);
      }

    } catch (error: any) {
      toast({ title: 'Error loading story', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [storyId, user, userProfile, router, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchStoryData();
    } else if (!authLoading && !user) {
      router.push(`/login?redirect=/story/${storyId}`);
    }
  }, [authLoading, user, storyId, fetchStoryData, router]);

  const handleChoice = async (choiceText: string) => {
    if (!user || !story || isProcessingChoice) return;
    setIsProcessingChoice(true);
    try {
      const result = await handleStoryChoiceAction(user.uid, userProfile?.name || user.displayName || 'Adventurer', story.id, choiceText);
      if (result.error || !result.aiResponse) {
        toast({ title: 'AI Error', description: result.error || 'Could not process choice.', variant: 'destructive' });
      } else {
        setCurrentAiTurn(result.aiResponse);
        if(result.nextProgress) setUserProgress(result.nextProgress);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to process choice.', variant: 'destructive' });
    } finally {
      setIsProcessingChoice(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Header />
        <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
        <p className="text-lg mt-2 text-muted-foreground">Loading your story adventure...</p>
      </div>
    );
  }

  if (!story || !storyCharacter || !currentAiTurn) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Header />
        <p className="text-lg mt-2 text-muted-foreground">Could not load story content. Please try again.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-24 pb-8">
        <Card className="max-w-2xl mx-auto bg-card/90 backdrop-blur-lg shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-primary/30 rounded-lg">
                <AvatarImage src={storyCharacter.avatarUrl} alt={storyCharacter.name} />
                <AvatarFallback className="bg-pink-100 text-pink-600 rounded-lg">{getInitials(storyCharacter.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl md:text-2xl font-headline text-primary">{story.title}</CardTitle>
                <CardDescription className="text-sm md:text-base font-body">An interactive story with {storyCharacter.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-[300px] flex flex-col">
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none flex-grow bg-muted/30 p-3 rounded-lg shadow-inner">
              <ReactMarkdown
                components={{ // Allow basic formatting like newlines
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                }}
              >
                {currentAiTurn.narrationForThisTurn}
              </ReactMarkdown>
            </div>

            {currentAiTurn.personalQuestion && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg text-accent-foreground italic text-sm md:text-base shadow">
                <p><MessageCircle className="inline h-4 w-4 mr-1.5 mb-0.5"/>{currentAiTurn.personalQuestion}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 md:p-6 border-t border-border/50">
            {isProcessingChoice ? (
              <div className="w-full flex justify-center items-center py-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Waiting for {storyCharacter.name}'s reply...</p>
              </div>
            ) : (
              <div className="w-full space-y-3">
                 <p className="text-center text-sm text-muted-foreground font-semibold">{currentAiTurn.narrationForThisTurn.endsWith("😘") ? "" : "What happens next, jaan? 😘"}</p>
                <Button
                  onClick={() => handleChoice(currentAiTurn.choiceA)}
                  className="w-full !rounded-lg text-base py-3 bg-primary/80 hover:bg-primary"
                >
                  a) {currentAiTurn.choiceA}
                </Button>
                <Button
                  onClick={() => handleChoice(currentAiTurn.choiceB)}
                  className="w-full !rounded-lg text-base py-3 bg-primary/80 hover:bg-primary"
                >
                  b) {currentAiTurn.choiceB}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

export default function StoryPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-background items-center justify-center">
                <Header />
                <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
                <p className="text-lg mt-2 text-muted-foreground">Loading Story...</p>
            </div>
        }>
            <StoryPlayerContent />
        </Suspense>
    );
}
