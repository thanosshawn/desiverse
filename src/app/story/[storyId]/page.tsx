// src/app/story/[storyId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { InteractiveStory, UserStoryProgress, StoryTurnOutput, CharacterMetadata, StoryTurnRecord } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getInteractiveStory, getUserStoryProgress, getCharacterMetadata, updateUserStoryProgress } from '@/lib/firebase/rtdb';
import { handleStoryMessageAction } from '../actions';
import { Loader2, User, BookHeart, Sparkles, SendHorizonal, MessageSquare, Drama } from 'lucide-react';
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
  
  // currentAiTurn now stores the full StoryTurnOutput, which includes optional choices
  const [currentAiTurn, setCurrentAiTurn] = useState<StoryTurnOutput | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // Generic processing state
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [userInput, setUserInput] = useState('');
  const storyContentRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    storyContentRef.current?.scrollTo({ top: storyContentRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [userProgress?.history, currentAiTurn]);


  const fetchInitialStoryData = useCallback(async () => {
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

      let progressData = await getUserStoryProgress(user.uid, storyId);
      
      if (progressData?.currentTurnContext) {
         setCurrentAiTurn({
           narrationForThisTurn: progressData.currentTurnContext.summaryOfCurrentSituation,
           choiceA: progressData.currentTurnContext.choiceA || undefined,
           choiceB: progressData.currentTurnContext.choiceB || undefined,
         });
         setUserProgress(progressData);
      } else {
        // This is the first turn or a turn where narration is missing/reset
        const initialUserMessage = "Let's begin the story!";
        const aiResult = await handleStoryMessageAction(
          user.uid,
          userProfile?.name || user.displayName || 'Adventurer',
          storyId,
          initialUserMessage
        );

        if (aiResult.error || !aiResult.aiResponse?.narrationForThisTurn) {
          toast({ title: 'AI Error', description: aiResult.error || 'Could not start story.', variant: 'destructive' });
          setCurrentAiTurn({ narrationForThisTurn: "Sorry, I'm a bit lost for words! Please try starting again."});
        } else {
          setCurrentAiTurn(aiResult.aiResponse);
          if (aiResult.nextProgress) setUserProgress(aiResult.nextProgress);
          else { // Manually construct first progress if not returned (e.g. first turn)
            const initialProgress: UserStoryProgress = {
              userId: user.uid,
              storyId,
              currentTurnContext: {
                summaryOfCurrentSituation: aiResult.aiResponse.narrationForThisTurn,
                previousUserChoice: initialUserMessage,
                choiceA: aiResult.aiResponse.choiceA || null,
                choiceB: aiResult.aiResponse.choiceB || null,
              },
              storyTitleSnapshot: storyData.title,
              characterIdSnapshot: storyData.characterId,
              lastPlayed: Date.now(),
              history: [{
                userChoice: "Story Started",
                aiNarration: aiResult.aiResponse.narrationForThisTurn,
                timestamp: Date.now(),
                offeredChoiceA: aiResult.aiResponse.choiceA || null,
                offeredChoiceB: aiResult.aiResponse.choiceB || null,
              }]
            };
            setUserProgress(initialProgress);
          }
        }
      }
      setInitialLoadComplete(true);
    } catch (error: any) {
      toast({ title: 'Error loading story', description: error.message, variant: 'destructive' });
      setCurrentAiTurn({ narrationForThisTurn: "There was an error loading the story. Please try again."});
    } finally {
      setIsLoading(false);
    }
  }, [storyId, user, userProfile, router, toast, initialLoadComplete]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchInitialStoryData();
    } else if (!authLoading && !user) {
      router.push(`/login?redirect=/story/${storyId}`);
    }
  }, [authLoading, user, storyId, fetchInitialStoryData, router]);

  const processUserInput = async (message: string) => {
    if (!user || !story || isProcessing || !message.trim()) return;
    setIsProcessing(true);
    const currentMessage = message.trim();
    setUserInput(''); // Clear input field optimistically if it's from textarea

    const optimisticUserTurn: StoryTurnRecord = {
        userChoice: currentMessage,
        aiNarration: "", // Placeholder, will be filled by AI
        timestamp: Date.now(),
        // We don't know offered choices yet for this optimistic turn
    };

    setUserProgress(prev => ({
        ...(prev ?? { 
            userId: user.uid, 
            storyId, 
            currentTurnContext: { summaryOfCurrentSituation: currentAiTurn?.narrationForThisTurn || story.initialSceneSummary, previousUserChoice: "" },
            storyTitleSnapshot: story.title,
            characterIdSnapshot: story.characterId,
            lastPlayed: Date.now()
        }),
        history: [...(prev?.history || []), optimisticUserTurn]
    }));
    setCurrentAiTurn(null); // Clear current AI turn to show loading for narration

    try {
      const result = await handleStoryMessageAction(
        user.uid,
        userProfile?.name || user.displayName || 'Adventurer',
        story.id,
        currentMessage
      );

      if (result.error || !result.aiResponse?.narrationForThisTurn) {
        toast({ title: 'AI Error', description: result.error || 'Could not process your message.', variant: 'destructive' });
        setCurrentAiTurn({ narrationForThisTurn: "Oops, something went wrong with my response. Please try again!" });
        // Revert optimistic update if AI failed
        setUserProgress(prev => ({ ...prev!, history: prev!.history?.slice(0, -1) }));
      } else {
        setCurrentAiTurn(result.aiResponse);
        if (result.nextProgress) {
          setUserProgress(result.nextProgress);
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to process your message.', variant: 'destructive' });
      setCurrentAiTurn({ narrationForThisTurn: "An error occurred. Please try again." });
      setUserProgress(prev => ({ ...prev!, history: prev!.history?.slice(0, -1) }));
    } finally {
      setIsProcessing(false);
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
  
  const displayChoices = currentAiTurn?.choiceA && currentAiTurn?.choiceB;

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-24 pb-8 flex flex-col items-center">
        <Card className="w-full max-w-2xl bg-card/90 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden animate-fade-in border-2 border-primary/20 flex flex-col">
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
          <CardContent ref={storyContentRef} className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-[300px] max-h-[calc(100vh-400px)] md:max-h-[calc(100vh-420px)] overflow-y-auto flex flex-col scroll-smooth">
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
            
            {/* Display current AI narration if it's a new turn and not yet in history */}
            {currentAiTurn?.narrationForThisTurn && (!userProgress?.history || userProgress.history.length === 0 || userProgress.history[userProgress.history.length -1].aiNarration !== currentAiTurn.narrationForThisTurn) && (
                 <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-muted/20 p-4 rounded-xl shadow-inner text-foreground/90 leading-relaxed font-body animate-fade-in self-start mr-auto max-w-[85%]">
                    <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} /> }}>
                        {currentAiTurn.narrationForThisTurn}
                    </ReactMarkdown>
                </div>
            )}
            
            {isProcessing && !currentAiTurn?.narrationForThisTurn && (
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
            {isProcessing && !displayChoices ? ( // Show loader only if not displaying choices already from previous turn
              <div className="w-full flex justify-center items-center py-3.5">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground font-medium">Processing...</p>
              </div>
            ) : displayChoices ? (
              <div className="w-full space-y-2.5">
                <Button
                  onClick={() => processUserInput(currentAiTurn!.choiceA!)}
                  variant="outline"
                  className="w-full !rounded-xl text-base py-3 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary shadow-sm"
                  disabled={isProcessing}
                >
                  {currentAiTurn!.choiceA}
                </Button>
                <Button
                  onClick={() => processUserInput(currentAiTurn!.choiceB!)}
                  variant="outline"
                  className="w-full !rounded-xl text-base py-3 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary shadow-sm"
                  disabled={isProcessing}
                >
                  {currentAiTurn!.choiceB}
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); processUserInput(userInput); }} className="w-full flex items-end gap-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={`What do you say or do, ${userProfile?.name || 'jaan'}?`}
                  className="flex-grow resize-none max-h-28 p-3 rounded-xl shadow-inner focus:ring-2 focus:ring-primary focus:border-primary bg-background/80 border-border/70 text-sm md:text-base"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      processUserInput(userInput);
                    }
                  }}
                  disabled={isProcessing}
                  aria-label="Your response in the story"
                />
                <Button
                  type="submit"
                  variant="default"
                  size="icon"
                  disabled={isProcessing || !userInput.trim()}
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
