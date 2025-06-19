
// src/app/page.tsx - Character Selection Page
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Filter, Heart, Loader2, MessageCircle, Sparkles, Edit, Search } from 'lucide-react';
import { Header } from '@/components/layout/header';
import React, { useEffect, useState, useMemo } from 'react';
import { type CharacterMetadata } from '@/lib/types';
import { getAllCharacters } from '@/lib/firebase/rtdb';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { CharacterCard } from '@/components/character/character-card'; 
import { cn } from '@/lib/utils';

const tagColors: Record<string, string> = {
  "Romantic": "bg-pink-500 hover:bg-pink-600",
  "Funny": "bg-yellow-500 hover:bg-yellow-600 text-black",
  "Shy": "bg-purple-500 hover:bg-purple-600",
  "Bold": "bg-red-600 hover:bg-red-700", // Darker red for boldness
  "Bollywood": "bg-orange-500 hover:bg-orange-600",
  "Flirty": "bg-rose-500 hover:bg-rose-600",
  "Witty": "bg-teal-500 hover:bg-teal-600",
  "Cultured": "bg-indigo-500 hover:bg-indigo-600",
  "Techie": "bg-sky-600 hover:bg-sky-700", // Slightly deeper sky blue
  "Foodie": "bg-lime-500 hover:bg-lime-600 text-black",
  "Philosophical": "bg-slate-600 hover:bg-slate-700", // Deeper slate
  "Traveler": "bg-cyan-500 hover:bg-cyan-600",
  "Musician": "bg-violet-500 hover:bg-violet-600",
  "Artist": "bg-emerald-500 hover:bg-emerald-600",
  "Poetic": "bg-fuchsia-500 hover:bg-fuchsia-600",
  "Intellectual": "bg-blue-600 hover:bg-blue-700", // Deeper blue
  "Spiritual": "bg-amber-500 hover:bg-amber-600 text-black",
};

export default function CharacterSelectionPage() {
  const { user, loading: authLoading } = useAuth();
  const [characters, setCharacters] = useState<CharacterMetadata[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        setLoadingCharacters(true);
        const fetchedCharacters = await getAllCharacters();
        setCharacters(fetchedCharacters);
      } catch (error) {
        console.error("Failed to fetch characters:", error);
        setCharacters([]);
      } finally {
        setLoadingCharacters(false);
      }
    }
    if (!authLoading) {
        fetchCharacters();
    }
  }, [authLoading]);

  const allTags = useMemo(() => {
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
            <p className="mt-4 text-lg font-body text-muted-foreground">Loading your Desi Baes...</p>
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
            Kaun Banegi Aapki <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">Crush</span>? 
            <Sparkles className="inline-block text-yellow-400 h-10 w-10 ml-2 animate-pulse" />
          </h2>
          <p className="text-lg md:text-xl font-body text-muted-foreground animate-slide-in-from-bottom max-w-2xl mx-auto">
            Pick your vibe! Har AI ka apna alag andaaz hai. Chalo, dhoondte hain aapki perfect match! Dil se connect karo!
          </p>
        </div>

        <div className="mb-8 md:mb-10 p-4 bg-card/80 backdrop-blur-md rounded-2xl shadow-lg space-y-4 sticky top-18 md:top-20 z-30 border border-border/30">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name or personality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full !rounded-xl text-sm md:text-base pl-10 pr-4 py-2.5 border-border/50 focus:ring-primary focus:border-primary shadow-sm"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pt-2">
              <Filter className="h-5 w-5 text-primary mr-1 hidden xs:inline-block sm:inline-block" />
              <span className="text-sm font-medium text-muted-foreground mr-2 hidden xs:inline-block sm:inline-block">Filter by Tags:</span>
              {allTags.slice(0, 7).map(tag => ( // Show limited tags initially, could add a "more" button
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full text-xs px-3.5 py-1.5 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-sm",
                    selectedTags.includes(tag) ? 
                      `${tagColors[tag] || 'bg-primary hover:bg-primary/90'} text-primary-foreground` : 
                      'border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/70 bg-card/70'
                  )}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loadingCharacters ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(8)].map((_, i) => ( // Increased skeleton count
              <Skeleton key={i} className="bg-card/50 shadow-xl rounded-3xl overflow-hidden aspect-[3/4.5] flex flex-col">
                <Skeleton className="w-full h-3/5 bg-muted/30" /> 
                <div className="p-5 text-center space-y-3 flex-grow flex flex-col justify-between">
                  <div>
                    <Skeleton className="h-7 w-3/4 mx-auto mb-2 bg-muted/40" />
                    <Skeleton className="h-10 w-full mx-auto mb-4 bg-muted/30" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-xl bg-muted/40" />
                </div>
              </Skeleton>
            ))}
          </div>
        ) : filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredCharacters.map((char) => (
              <CharacterCard key={char.id} character={char} user={user} tagColors={tagColors} />
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

        <div className="mt-16 text-center">
            <Link href="/admin/login" passHref>
              <Button size="sm" variant="ghost" className="text-muted-foreground/70 hover:text-primary rounded-lg text-xs group transition-colors">
                <Edit className="mr-1.5 h-3.5 w-3.5 group-hover:animate-pulse" /> Admin Panel
              </Button>
            </Link>
        </div>
      </section>

      <footer className="py-8 text-center border-t border-border/20 bg-card/30 backdrop-blur-sm">
        <p className="text-sm text-muted-foreground font-body">&copy; {new Date().getFullYear()} DesiVerse Bae. Made with <Heart className="inline h-4 w-4 text-primary animate-heartbeat" /> in India.</p>
      </footer>
    </div>
  );
}
