
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
import { Loader2, User, BookHeart, Sparkles, ChevronRight } from 'lucide-react'; // Removed Drama, Send, MessageCircle
import { getInitials, cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchStoryData = useCallback(async () => {
    if (!storyId || !user || initialLoadComplete) return;
    setIsLoading(true);
    try {
      const storyData = await getInteractiveStory(storyId);
      if (!storyData) {
        toast({ title: 'Kahani Nahi Mili 😟', description: 'Story not found.', variant: 'destructive' });
        router.push('/stories');
        return;
      }
      setStory(storyData);

      const charData = await getCharacterMetadata(storyData.characterId);
      if (!charData) {
        toast({ title: 'Character Error', description: 'Character for this story not found.', variant: 'destructive' });
        router.push('/stories');
        return;
      }
      setStoryCharacter(charData);

      const progressData = await getUserStoryProgress(user.uid, storyId);
      setUserProgress(progressData); // This now includes history

      // Determine initial AI turn: if progress exists and has current choices, use them.
      // Otherwise, call AI for the first turn or to resume.
      if (progressData?.currentTurnContext?.summaryOfCurrentSituation && progressData.currentTurnContext.choiceA && progressData.currentTurnContext.choiceB) {
        setCurrentAiTurn({
          narrationForThisTurn: progressData.currentTurnContext.summaryOfCurrentSituation,
          choiceA: progressData.currentTurnContext.choiceA,
          choiceB: progressData.currentTurnContext.choiceB,
        });
      } else {
        // This is the first turn or a turn where choices weren't saved/are missing
        const initialUserChoice = progressData?.currentTurnContext?.previousUserChoice || "Let's begin the story!";
        const aiResult = await handleStoryChoiceAction(
          user.uid,
          userProfile?.name || user.displayName || 'Adventurer',
          storyId,
          initialUserChoice
        );

        if (aiResult.error || !aiResult.aiResponse) {
          toast({ title: 'AI Error', description: aiResult.error || 'Could not start or continue story.', variant: 'destructive' });
          setCurrentAiTurn(null); // Ensure choices are not shown if AI fails
        } else {
          setCurrentAiTurn(aiResult.aiResponse);
          if (aiResult.nextProgress) setUserProgress(aiResult.nextProgress); // Update progress with history
        }
      }
      setInitialLoadComplete(true);
    } catch (error: any) {
      toast({ title: 'Error loading story', description: error.message, variant: 'destructive' });
      setCurrentAiTurn(null);
    } finally {
      setIsLoading(false);
    }
  }, [storyId, user, userProfile, router, toast, initialLoadComplete]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchStoryData();
    } else if (!authLoading && !user) {
      router.push(`/login?redirect=/story/${storyId}`);
    }
  }, [authLoading, user, storyId, fetchStoryData, router]);

  const handleChoice = async (choiceText: string) => {
    if (!user || !story || isProcessingChoice || !currentAiTurn) return;
    setIsProcessingChoice(true);

    try {
      const result = await handleStoryChoiceAction(
        user.uid,
        userProfile?.name || user.displayName || 'Adventurer',
        story.id,
        choiceText
      );

      if (result.error || !result.aiResponse) {
        toast({ title: 'AI Error', description: result.error || 'Could not process choice.', variant: 'destructive' });
        // Potentially keep currentAiTurn or clear it if the error is severe
      } else {
        setCurrentAiTurn(result.aiResponse); // This contains new narration & choices for the NEXT turn
        if (result.nextProgress) {
          setUserProgress(result.nextProgress); // Update progress which now includes the new history item
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to process choice.', variant: 'destructive' });
    } finally {
      setIsProcessingChoice(false);
    }
  };
  
  useEffect(() => { 
    const bodyEl = document.body;
    const htmlEl = document.documentElement;
    if (storyCharacter?.backgroundImageUrl) {
       const rootStyle = getComputedStyle(htmlEl);
       const bgHslString = rootStyle.getPropertyValue('--background').trim();
       const hslMatch = bgHslString.match(/(?:hsl\(\s*)?([\d.]+)\s*[\s,]\s*([\d.]+%?)\s*[\s,]\s*([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?(?:\s*\))?/);
       let overlayColor = 'hsla(var(--background), 0.85)'; 

       if (hslMatch && hslMatch.length >= 4) {
         const alpha = hslMatch[4] ? parseFloat(hslMatch[4]) * 0.85 : 0.85;
         overlayColor = `hsla(${hslMatch[1]}, ${hslMatch[2]}, ${hslMatch[3]}, ${alpha})`;
       }
      bodyEl.style.backgroundImage = `linear-gradient(${overlayColor}, ${overlayColor}), url(${storyCharacter.backgroundImageUrl})`;
      bodyEl.style.backgroundSize = 'cover';
      bodyEl.style.backgroundPosition = 'center';
      bodyEl.style.backgroundAttachment = 'fixed';
    }
    return () => {
      bodyEl.style.backgroundImage = '';
      bodyEl.style.backgroundSize = '';
      bodyEl.style.backgroundPosition = '';
      bodyEl.style.backgroundAttachment = '';
    };
  }, [storyCharacter]);


  if (isLoading || authLoading || !story || !storyCharacter ) { // Simpler loading check
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <Header />
        <Loader2 className="h-16 w-16 animate-spin text-primary mt-4" />
        <p className="text-lg mt-3 text-muted-foreground font-body">
          Loading your story adventure... ✨
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-24 pb-8 flex flex-col items-center">
        <Card className="w-full max-w-2xl bg-card/90 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden animate-fade-in border-2 border-primary/20">
          <CardHeader className="p-4 md:p-6 border-b border-border/30 bg-gradient-to-br from-primary/10 via-card to-secondary/10">
            <div className="flex items-center gap-3 md:gap-4">
              <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-primary/50 rounded-xl shadow-md">
                <AvatarImage src={storyCharacter.avatarUrl} alt={storyCharacter.name} className="rounded-lg"/>
                <AvatarFallback className="bg-pink-100 text-pink-600 rounded-xl font-semibold">{getInitials(storyCharacter.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl md:text-2xl font-headline text-primary drop-shadow-sm">{story.title}</CardTitle>
                <CardDescription className="text-sm md:text-base font-body text-muted-foreground">An interactive story with {storyCharacter.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-[300px] max-h-[calc(100vh-300px)] overflow-y-auto flex flex-col scroll-smooth">
            {/* Display Full Story History */}
            {userProgress?.history?.map((turnRecord, index) => (
              <React.Fragment key={index}>
                {/* User's Choice that led to this AI Narration */}
                {turnRecord.userChoice !== "Story Started" && ( // Don't show "You Chose: Story Started"
                   <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 shadow-sm animate-slide-in-from-bottom self-end ml-auto max-w-[85%]">
                    <div className="flex items-start gap-2.5">
                      <User className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-medium text-secondary/90 uppercase tracking-wider">You Chose:</p>
                        <p className="text-foreground/90 text-sm italic leading-relaxed">
                          {turnRecord.userChoice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI's Narration for that turn */}
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-muted/20 p-4 rounded-xl shadow-inner text-foreground/90 leading-relaxed font-body animate-fade-in self-start mr-auto max-w-[85%]">
                  <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} /> }}>
                    {turnRecord.aiNarration}
                  </ReactMarkdown>
                </div>
                
                {index < userProgress.history!.length -1 && ( // Simple divider between turns
                  <div className="my-1 border-b border-dashed border-border/30"></div>
                )}
              </React.Fragment>
            ))}
            
            {/* If history is empty and currentAiTurn has the initial narration (first ever turn) */}
            {(!userProgress?.history || userProgress.history.length === 0) && currentAiTurn?.narrationForThisTurn && (
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-muted/20 p-4 rounded-xl shadow-inner text-foreground/90 leading-relaxed font-body animate-fade-in self-start mr-auto max-w-[85%]">
                    <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} /> }}>
                        {currentAiTurn.narrationForThisTurn}
                    </ReactMarkdown>
                </div>
            )}

          </CardContent>
          <CardFooter className="p-4 md:p-6 border-t border-border/30 bg-card/50">
            {isProcessingChoice ? (
              <div className="w-full flex justify-center items-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground font-medium">Waiting for {storyCharacter.name}'s reply...</p>
              </div>
            ) : currentAiTurn && currentAiTurn.choiceA && currentAiTurn.choiceB ? (
              <div className="w-full space-y-3">
                 <p className="text-center text-sm text-muted-foreground font-semibold mb-2">What happens next, {userProfile?.name || 'jaan'}? <Sparkles className="inline h-4 w-4 text-yellow-400 animate-pulse" /></p>
                {[currentAiTurn.choiceA, currentAiTurn.choiceB].map((choice, index) => (
                  <Button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    variant="default"
                    className="w-full !rounded-xl text-base py-3.5 shadow-lg hover:shadow-primary/30 transition-all duration-200 ease-in-out transform hover:scale-[1.02] group bg-gradient-to-r from-primary/80 via-rose-500/80 to-pink-600/80 hover:from-primary hover:via-rose-500 hover:to-pink-600 text-primary-foreground flex items-center justify-between"
                    aria-label={`Choice ${index === 0 ? 'A' : 'B'}: ${choice}`}
                  >
                    <span className="text-left flex-grow">{choice}</span>
                    <ChevronRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                ))}
              </div>
            ) : (
                 <div className="w-full text-center py-4">
                    <p className="text-muted-foreground">Loading story choices or end of current path...</p>
                     {/* Add a button to retry fetching initial story if currentAiTurn is null and not processing */}
                    {!currentAiTurn && !isProcessingChoice && (
                        <Button onClick={() => { setInitialLoadComplete(false); fetchStoryData(); }} className="mt-2 !rounded-lg">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Retry Loading Story
                        </Button>
                    )}
                </div>
            )}
          </CardFooter>
        </Card>
        <div className="text-center mt-8">
            <Button variant="outline" onClick={() => router.push('/stories')} className="!rounded-xl border-primary/50 text-primary hover:bg-primary/10 hover:border-primary shadow-sm">
                <BookHeart className="mr-2 h-4 w-4"/> Back to All Stories
            </Button>
        </div>
      </main>
    </div>
  );
}

export default function StoryPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
                <Header />
                <Loader2 className="h-16 w-16 animate-spin text-primary mt-4" />
                <p className="text-lg mt-3 text-muted-foreground font-body">Loading Story...</p>
            </div>
        }>
            <StoryPlayerContent />
        </Suspense>
    );
}
