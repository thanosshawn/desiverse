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
import { handleStoryMessageAction } from '../actions'; // Updated action name
import { Loader2, User, BookHeart, Sparkles, SendHorizonal, MessageSquare } from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';

function StoryPlayerContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;
  const { toast } = useToast();

  const [story, setStory] = useState<InteractiveStory | null>(null);
  const [storyCharacter, setStoryCharacter] = useState<CharacterMetadata | null>(null);
  const [userProgress, setUserProgress] = useState<UserStoryProgress | null>(null);
  
  // currentAiTurn now only stores the latest narration
  const [currentAiNarration, setCurrentAiNarration] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingChoice, setIsProcessingChoice] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [userInput, setUserInput] = useState('');

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
      setUserProgress(progressData);

      if (progressData?.currentTurnContext?.summaryOfCurrentSituation) {
        setCurrentAiNarration(progressData.currentTurnContext.summaryOfCurrentSituation);
      } else {
        // This is the first turn or a turn where narration is missing
        const initialUserInput = progressData?.currentTurnContext?.previousUserChoice || "Let's begin the story!";
        const aiResult = await handleStoryMessageAction( // Use new action name
          user.uid,
          userProfile?.name || user.displayName || 'Adventurer',
          storyId,
          initialUserInput
        );

        if (aiResult.error || !aiResult.aiResponse?.narrationForThisTurn) {
          toast({ title: 'AI Error', description: aiResult.error || 'Could not start or continue story.', variant: 'destructive' });
          setCurrentAiNarration("Sorry, I'm a bit lost for words! Please try starting again or contact support if this persists.");
        } else {
          setCurrentAiNarration(aiResult.aiResponse.narrationForThisTurn);
          if (aiResult.nextProgress) setUserProgress(aiResult.nextProgress);
        }
      }
      setInitialLoadComplete(true);
    } catch (error: any) {
      toast({ title: 'Error loading story', description: error.message, variant: 'destructive' });
      setCurrentAiNarration("There was an error loading the story. Please try again.");
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

  const handleSendMessage = async () => { // Renamed from handleChoice
    if (!user || !story || isProcessingChoice || !userInput.trim()) return;
    setIsProcessingChoice(true);
    const currentMessage = userInput.trim();
    setUserInput(''); // Clear input field optimistically

    try {
      // Optimistically add user message to history for UI
      const optimisticUserTurn: StoryTurnRecord = {
        userChoice: currentMessage,
        aiNarration: "", // AI narration will be filled by server response
        timestamp: Date.now(),
      };
      setUserProgress(prev => ({
          ...(prev ?? { 
              userId: user.uid, 
              storyId, 
              currentTurnContext: { summaryOfCurrentSituation: currentAiNarration || story.initialSceneSummary, previousUserChoice: "" },
              storyTitleSnapshot: story.title,
              characterIdSnapshot: story.characterId,
              lastPlayed: Date.now()
          }),
          history: [...(prev?.history || []), optimisticUserTurn]
      }));


      const result = await handleStoryMessageAction( // Use new action name
        user.uid,
        userProfile?.name || user.displayName || 'Adventurer',
        story.id,
        currentMessage
      );

      if (result.error || !result.aiResponse?.narrationForThisTurn) {
        toast({ title: 'AI Error', description: result.error || 'Could not process your message.', variant: 'destructive' });
        // Revert optimistic update or show error message in thread
        setUserProgress(prev => ({
            ...prev!,
            history: prev!.history?.slice(0, -1) // Remove optimistic user turn
        }));
      } else {
        setCurrentAiNarration(result.aiResponse.narrationForThisTurn);
        if (result.nextProgress) {
          setUserProgress(result.nextProgress); // Update progress with full history from server
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to process your message.', variant: 'destructive' });
       setUserProgress(prev => ({
            ...prev!,
            history: prev!.history?.slice(0, -1) 
        }));
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


  if (isLoading || authLoading || !story || !storyCharacter ) {
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
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-[300px] max-h-[calc(100vh-350px)] overflow-y-auto flex flex-col scroll-smooth">
            {userProgress?.history?.map((turnRecord, index) => (
              <React.Fragment key={index}>
                {turnRecord.userChoice && turnRecord.userChoice !== "Story Started" && (
                   <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 shadow-sm animate-slide-in-from-bottom self-end ml-auto max-w-[85%]">
                    <div className="flex items-start gap-2.5">
                      <User className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-medium text-secondary/90 uppercase tracking-wider">You:</p>
                        <p className="text-foreground/90 text-sm leading-relaxed">
                          {turnRecord.userChoice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {turnRecord.aiNarration && (
                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-muted/20 p-4 rounded-xl shadow-inner text-foreground/90 leading-relaxed font-body animate-fade-in self-start mr-auto max-w-[85%]">
                    <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} /> }}>
                        {turnRecord.aiNarration}
                    </ReactMarkdown>
                    </div>
                )}
                
                {index < userProgress.history!.length -1 && ( 
                  <div className="my-1 border-b border-dashed border-border/30"></div>
                )}
              </React.Fragment>
            ))}
            
             {/* Display current AI narration if not already covered by history (e.g., very first turn) */}
            {(!userProgress?.history || userProgress.history.length === 0) && currentAiNarration && (
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-muted/20 p-4 rounded-xl shadow-inner text-foreground/90 leading-relaxed font-body animate-fade-in self-start mr-auto max-w-[85%]">
                    <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} /> }}>
                        {currentAiNarration}
                    </ReactMarkdown>
                </div>
            )}

             {/* Loading indicator for AI response */}
            {isProcessingChoice && (
                <div className="flex items-center space-x-2.5 text-muted-foreground self-start mr-auto max-w-[85%] p-4">
                    <Avatar className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full shadow-md self-end mb-1 border-2 border-accent/30">
                        <AvatarImage src={storyCharacter.avatarUrl} alt={storyCharacter.name} />
                        <AvatarFallback className="bg-accent/20 text-accent text-sm font-semibold">{getInitials(storyCharacter.name)}</AvatarFallback>
                    </Avatar>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30 shadow-sm">
                        <Sparkles className="h-5 w-5 animate-pulse-spinner text-primary inline-block mr-2" />
                        <span className="text-sm italic">{storyCharacter.name} is thinking...</span>
                    </div>
                </div>
            )}


          </CardContent>
          <CardFooter className="p-3 md:p-4 border-t border-border/30 bg-card/50">
            {isProcessingChoice ? (
              <div className="w-full flex justify-center items-center py-3.5">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground font-medium">Processing...</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="w-full flex items-end gap-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={`What do you say or do, ${userProfile?.name || 'jaan'}?`}
                  className="flex-grow resize-none max-h-28 p-3 rounded-xl shadow-inner focus:ring-2 focus:ring-primary focus:border-primary bg-background/80 border-border/70 text-sm md:text-base"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isProcessingChoice}
                  aria-label="Your response in the story"
                />
                <Button
                  type="submit"
                  variant="default"
                  size="icon"
                  disabled={isProcessingChoice || !userInput.trim()}
                  className="bg-gradient-to-br from-primary via-rose-500 to-pink-600 hover:shadow-glow-primary text-primary-foreground rounded-xl p-3 aspect-square shadow-lg transform transition-transform hover:scale-105 focus:ring-2 ring-primary ring-offset-2 ring-offset-background h-12 w-12 md:h-[52px] md:w-[52px]"
                  title="Send your message"
                >
                  <SendHorizonal className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </form>
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
