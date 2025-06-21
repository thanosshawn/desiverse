
// src/app/stories/page.tsx - Story Listing Page
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, BookHeart, Sparkles, Filter, History, Search } from 'lucide-react'; 
import { Header } from '@/components/layout/header';
import React, { useEffect, useState, useMemo, Suspense } from 'react';
import type { InteractiveStory, CharacterMetadata } from '@/lib/types';
import { getAllInteractiveStories, getAllCharacters } from '@/lib/firebase/rtdb';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { StoryCard } from '@/components/story/story-card';
import { cn } from '@/lib/utils';

const tagColors: Record<string, string> = {
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


function StoryListingContent() {
  const { user, loading: authLoading } = useAuth();
  const [stories, setStories] = useState<InteractiveStory[]>([]);
  const [characters, setCharacters] = useState<Record<string, CharacterMetadata>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        const [fetchedStories, fetchedCharactersList] = await Promise.all([
          getAllInteractiveStories(),
          getAllCharacters()
        ]);
        setStories(fetchedStories);
        const charMap = fetchedCharactersList.reduce((acc, char) => {
          acc[char.id] = char;
          return acc;
        }, {} as Record<string, CharacterMetadata>);
        setCharacters(charMap);
      } catch (error) {
        console.error("Failed to fetch stories or characters:", error);
        setStories([]);
        setCharacters({});
      } finally {
        setLoadingData(false);
      }
    }
    if (!authLoading) {
        fetchData();
    }
  }, [authLoading]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    stories.forEach(story => story.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [stories]);

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const characterName = story.characterNameSnapshot || characters[story.characterId]?.name || '';
      const matchesSearchTerm = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (characterName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => story.tags?.includes(tag));
      return matchesSearchTerm && matchesTags;
    });
  }, [stories, searchTerm, selectedTags, characters]);

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
            <p className="mt-4 text-lg font-body text-muted-foreground">Loading stories...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50 text-foreground">
      <Header />
      <section className="container mx-auto px-4 pt-20 md:pt-24 pb-12 flex-grow">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-3 text-primary animate-fade-in drop-shadow-sm">
            Choose Your <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">Adventure</span>
            <BookHeart className="inline-block text-accent h-10 w-10 ml-2 animate-pulse" />
          </h2>
          <p className="text-lg md:text-xl font-body text-muted-foreground animate-slide-in-from-bottom max-w-2xl mx-auto">
            Dive into interactive stories and shape the narrative with your Desi Bae! Your choices, your kahani.
          </p>
        </div>

        <div className="mb-8 md:mb-10 p-4 bg-card rounded-2xl shadow-xl space-y-4 sticky top-18 md:top-20 z-30 border border-border">
          <div className="relative">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search stories by title, description, or character..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full !rounded-xl text-sm md:text-base pl-10 pr-4 py-2.5 border-border/50 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>
           {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pt-2">
              <Filter className="h-5 w-5 text-primary mr-1 hidden xs:inline-block sm:inline-block" />
              <span className="text-sm font-medium text-muted-foreground mr-2 hidden xs:inline-block sm:inline-block">Filter by Tags:</span>
              {allTags.slice(0, 7).map(tag => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full text-xs px-3.5 py-1.5 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-sm",
                    selectedTags.includes(tag) ? 
                      `${tagColors[tag] || 'bg-primary hover:bg-primary/90'} ${ (tag === 'Comedy' || tag === 'Spiritual' || tag === 'Hinglish' || tag === 'Foodie' || tag === 'Adventure') ? 'text-black' : 'text-primary-foreground'}` : 
                      'border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/70 bg-card'
                  )}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loadingData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="bg-card shadow-xl rounded-3xl overflow-hidden aspect-[16/11.5] flex flex-col border border-border">
                <Skeleton className="w-full h-3/5 bg-muted/30" />
                <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                  <div>
                    <Skeleton className="h-7 w-3/4 mb-2 bg-muted/40" />
                    <Skeleton className="h-12 w-full mb-4 bg-muted/30" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-xl bg-muted/40" />
                </div>
              </Skeleton>
            ))}
          </div>
        ) : filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredStories.map((story) => (
              <StoryCard 
                key={story.id} 
                story={story} 
                character={characters[story.characterId]} 
                tagColors={tagColors}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookHeart className="mx-auto h-20 w-20 text-primary/20 mb-6 animate-pulse" />
            <h3 className="text-2xl font-headline text-primary mb-3">No Stories Found... Yet! 😟</h3>
            <p className="text-muted-foreground font-body mb-6 max-w-md mx-auto">
              {searchTerm || selectedTags.length > 0 ? "Try adjusting your search or filters. More stories coming soon!" : "No interactive stories available right now. Check back soon!"}
            </p>
            { (searchTerm || selectedTags.length > 0) &&
                <Button onClick={() => { setSearchTerm(''); setSelectedTags([]); }} variant="outline" className="rounded-xl border-primary/50 text-primary hover:bg-primary/10">Clear Filters</Button>
            }
             <Link href="/" className="mt-4 ml-2 inline-block">
                <Button variant="default" className="!rounded-xl bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground shadow-lg hover:shadow-primary/30">Chat with Baes</Button>
            </Link>
          </div>
        )}
      </section>

      <footer className="py-8 text-center border-t border-border bg-card">
        <p className="text-sm text-muted-foreground font-body">&copy; {new Date().getFullYear()} DesiVerse Bae. Made with <Sparkles className="inline h-4 w-4 text-yellow-400 animate-pulse" /> in India.</p>
      </footer>
    </div>
  );
}

export default function StoryListPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <div className="flex-grow flex items-center justify-center p-4">
                     <div className="text-center">
                        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-lg font-body text-muted-foreground">Loading stories...</p>
                    </div>
                </div>
            </div>
        }>
            <StoryListingContent />
        </Suspense>
    );
}
