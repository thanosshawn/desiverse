
// src/app/page.tsx - Character Selection Page & Stories Section
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Filter, Heart, Loader2, MessageCircle, Sparkles, Edit, Search, BookHeart, ChevronRight, Mail } from 'lucide-react';
import { Header } from '@/components/layout/header';
import React, { useEffect, useState, useMemo } from 'react';
import type { CharacterMetadata, InteractiveStory, UserChatSessionMetadata } from '@/lib/types'; 
import { getAllCharacters, getAllInteractiveStories, getUserChatSessions } from '@/lib/firebase/rtdb'; 
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { CharacterCard } from '@/components/character/character-card'; 
import { StoryCard } from '@/components/story/story-card'; 
import { cn } from '@/lib/utils';
import { getDailyMessageAction } from './actions';
import { DailyMessageCard } from '@/components/home/daily-message-card';


const characterTagColors: Record<string, string> = {
  "Romantic": "bg-pink-500 hover:bg-pink-600",
  "Funny": "bg-yellow-500 hover:bg-yellow-600 text-black",
  "Shy": "bg-purple-500 hover:bg-purple-600",
  "Bold": "bg-red-600 hover:bg-red-700", 
  "Bollywood": "bg-orange-500 hover:bg-orange-600",
  "Flirty": "bg-rose-500 hover:bg-rose-600",
  "Witty": "bg-teal-500 hover:bg-teal-600",
  "Cultured": "bg-indigo-500 hover:bg-indigo-600",
  "Techie": "bg-sky-600 hover:bg-sky-700", 
  "Foodie": "bg-lime-500 hover:bg-lime-600 text-black",
  "Philosophical": "bg-slate-600 hover:bg-slate-700", 
  "Traveler": "bg-cyan-500 hover:bg-cyan-600",
  "Musician": "bg-violet-500 hover:bg-violet-600",
  "Artist": "bg-emerald-500 hover:bg-emerald-600",
  "Poetic": "bg-fuchsia-500 hover:bg-fuchsia-600",
  "Intellectual": "bg-blue-600 hover:bg-blue-700", 
  "Spiritual": "bg-amber-500 hover:bg-amber-600 text-black",
};

const storyTagColors: Record<string, string> = {
  "Adventure": "bg-sky-500 hover:bg-sky-600",
  "Romance": "bg-pink-500 hover:bg-pink-600",
  "Mystery": "bg-purple-500 hover:bg-purple-600",
  "Thriller": "bg-red-600 hover:bg-red-700",
  "Sci-Fi": "bg-indigo-500 hover:bg-indigo-600",
  "Fantasy": "bg-emerald-500 hover:bg-emerald-600",
  "Comedy": "bg-yellow-400 hover:bg-yellow-500 text-black", 
  "Drama": "bg-slate-600 hover:bg-slate-700",
  "Heartwarming": "bg-rose-400 hover:bg-rose-500",
  "Hinglish": "bg-orange-500 hover:bg-orange-600 text-black",
  "Foodie": "bg-lime-500 hover:bg-lime-600 text-black",
};


export default function HomePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<CharacterMetadata[]>([]);
  const [stories, setStories] = useState<InteractiveStory[]>([]); 
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // State for the daily message feature
  const [dailyMessage, setDailyMessage] = useState<string | null>(null);
  const [dailyMessageCharacter, setDailyMessageCharacter] = useState<UserChatSessionMetadata | null>(null);
  const [loadingDailyMessage, setLoadingDailyMessage] = useState(false);


  useEffect(() => {
    async function fetchData() {
      setLoadingCharacters(true);
      setLoadingStories(true);
      try {
        const [fetchedCharacters, fetchedStories] = await Promise.all([
            getAllCharacters(),
            getAllInteractiveStories()
        ]);
        setCharacters(fetchedCharacters);
        setStories(fetchedStories.slice(0, 3)); 
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setCharacters([]);
        setStories([]);
      } finally {
        setLoadingCharacters(false);
        setLoadingStories(false);
      }
    }
    if (!authLoading) {
        fetchData();
    }
  }, [authLoading]);

  // Fetch daily message
  useEffect(() => {
    async function fetchDailyMessage() {
      if (user && userProfile && characters.length > 0) {
        setLoadingDailyMessage(true);
        try {
          const sessions = await getUserChatSessions(user.uid);
          const primarySession = sessions[0]; // Gets the most recent/favorite
          if (primarySession) {
            const characterMeta = characters.find(c => c.id === primarySession.characterId);
            if (characterMeta) {
              setDailyMessageCharacter(primarySession);
              const result = await getDailyMessageAction(characterMeta, userProfile.name || user.displayName || 'Dost');
              if (result.message) {
                setDailyMessage(result.message);
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch daily message:", error);
        } finally {
          setLoadingDailyMessage(false);
        }
      }
    }
    
    // Only run if user is loaded and characters are loaded
    if (!authLoading && characters.length > 0) {
      fetchDailyMessage();
    }
  }, [authLoading, user, userProfile, characters]);

  const allCharacterTags = useMemo(() => {
    const tags = new Set<string>();
    characters.forEach(char => char.styleTags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [characters]);

  const filteredCharacters = useMemo(() => {
    return characters.filter(char => {
      const matchesSearchTerm = char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                char.personalitySnippet.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => char.styleTags.includes(tag));
      return matchesSearchTerm && matchesTags;
    });
  }, [characters, searchTerm, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg font-body text-muted-foreground">Loading your Desi Baes & Stories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50 text-foreground">
      <Header />

      <section className="container mx-auto px-4 pt-8 md:pt-10 pb-12 flex-grow">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-3 text-primary animate-fade-in drop-shadow-sm">
            Kaun Banegi Aapki <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">Crush</span>? 
            <Heart className="inline-block text-pink-400 fill-pink-500 h-10 w-10 ml-2 animate-hue-rotate-glow" />
          </h2>
          <p className="text-lg md:text-xl font-body text-muted-foreground animate-slide-in-from-bottom max-w-2xl mx-auto">
            Pick your vibe! Har AI ka apna alag andaaz hai. Chalo, dhoondte hain aapki perfect match! Dil se connect karo!
          </p>
        </div>
        
        { (user && (loadingDailyMessage || dailyMessage)) && (
          <div className="mb-10 md:mb-12">
            <DailyMessageCard 
              isLoading={loadingDailyMessage}
              message={dailyMessage}
              character={dailyMessageCharacter}
            />
          </div>
        )}

        {/* Search and Filter Bar - No longer sticky */}
        <div className="mb-8 md:mb-10 p-4 bg-card rounded-2xl shadow-xl space-y-4 border border-border">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search Baes by name or personality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full !rounded-full text-sm md:text-base pl-10 pr-4 py-3 bg-background border-border/60 focus:ring-2 focus:ring-primary focus:border-primary shadow-sm placeholder:text-xs placeholder:md:text-sm"
            />
          </div>
          {allCharacterTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pt-2">
              <Filter className="h-5 w-5 text-primary mr-1 hidden xs:inline-block sm:inline-block" />
              <span className="text-sm font-medium text-muted-foreground mr-2 hidden xs:inline-block sm:inline-block">Filter by Tags:</span>
              {allCharacterTags.slice(0, 7).map(tag => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full text-xs px-3.5 py-1.5 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-sm",
                    selectedTags.includes(tag) ? 
                      `${characterTagColors[tag] || 'bg-primary hover:bg-primary/90'} text-primary-foreground border-transparent` : 
                      'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/80 bg-card'
                  )}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-8">
          {loadingCharacters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {[...Array(4)].map((_, i) => ( 
                <Skeleton key={i} className="bg-card shadow-xl rounded-3xl overflow-hidden aspect-[3/4.5] flex flex-col border border-border">
                  <Skeleton className="w-full h-3/5 bg-muted" /> 
                  <div className="p-5 text-center space-y-3 flex-grow flex flex-col justify-between">
                    <div>
                      <Skeleton className="h-7 w-3/4 mx-auto mb-2 bg-muted" />
                      <Skeleton className="h-10 w-full mx-auto mb-4 bg-muted" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-xl bg-muted" />
                  </div>
                </Skeleton>
              ))}
            </div>
          ) : filteredCharacters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredCharacters.map((char) => (
                <CharacterCard key={char.id} character={char} user={user} tagColors={characterTagColors} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MessageCircle className="mx-auto h-20 w-20 text-primary/20 mb-6 animate-pulse" />
              <h3 className="text-2xl font-headline text-primary mb-3">Oops! Koi nahi mila... 😟</h3>
              <p className="text-muted-foreground font-body mb-6 max-w-md mx-auto">
                {searchTerm || selectedTags.length > 0 ? "Try adjusting your search or filters. Shayad aapki perfect match thodi alag hai!" : "No characters available right now. Hum jald hi naye AI Baes add karenge!"}
              </p>
              { (searchTerm || selectedTags.length > 0) &&
                  <Button onClick={() => { setSearchTerm(''); setSelectedTags([]); }} variant="outline" className="rounded-xl border-primary/50 text-primary hover:bg-primary/10">Clear Filters</Button>
              }
            </div>
          )}
        </div>


        <div className="mt-16 md:mt-20 pt-10 border-t-2 border-dashed border-primary/20">
          <div className="flex justify-between items-center mb-8 md:mb-10">
            <h2 className="text-3xl sm:text-4xl font-semibold font-headline text-primary animate-fade-in drop-shadow-sm">
                Latest <span className="bg-gradient-to-r from-secondary via-teal-500 to-sky-500 bg-clip-text text-transparent">Adventures</span>
                <BookHeart className="inline-block text-accent h-8 w-8 md:h-9 md:w-9 ml-2 animate-pulse" />
            </h2>
            <Link href="/stories" passHref>
                <Button variant="outline" className="!rounded-xl text-primary border-primary/50 hover:bg-primary/10 hover:text-primary shadow-sm group py-2.5 px-5 transform hover:scale-105 transition-transform">
                    View All Stories <ChevronRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
          </div>

            {loadingStories ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {[...Array(3)].map((_, i) => (
                         <Skeleton key={`story-skel-${i}`} className="bg-card shadow-xl rounded-3xl overflow-hidden aspect-[16/11.5] flex flex-col border border-border">
                            <Skeleton className="w-full h-3/5 bg-muted" />
                            <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                                <div>
                                    <Skeleton className="h-7 w-3/4 mb-2 bg-muted" />
                                    <Skeleton className="h-12 w-full mb-4 bg-muted" />
                                </div>
                                <Skeleton className="h-11 w-full rounded-xl bg-muted" />
                            </div>
                        </Skeleton>
                    ))}
                </div>
            ) : stories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {stories.map((story) => (
                        <StoryCard key={story.id} story={story} tagColors={storyTagColors} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <BookHeart className="mx-auto h-16 w-16 text-primary/20 mb-4" />
                    <p className="text-muted-foreground font-body">No interactive stories available yet. Check back soon for new adventures!</p>
                </div>
            )}
        </div>


        <div className="mt-16 text-center">
            <Link href="/admin/login" passHref>
              <Button size="sm" variant="ghost" className="text-muted-foreground/70 hover:text-primary rounded-lg text-xs group transition-colors py-2 px-3">
                <Edit className="mr-1.5 h-3.5 w-3.5 group-hover:animate-pulse" /> Admin Panel
              </Button>
            </Link>
        </div>
      </section>

      <footer className="py-8 text-center border-t border-border bg-card">
        <p className="text-sm text-muted-foreground font-body">&copy; {new Date().getFullYear()} DesiVerse Bae. Made with <Heart className="inline h-4 w-4 text-primary animate-heartbeat" /> in India.</p>
      </footer>
    </div>
  );
}
