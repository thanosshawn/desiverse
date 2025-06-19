// src/app/page.tsx - Character Selection Page
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Filter, Heart, Loader2, MessageCircle, Sparkles, Edit } from 'lucide-react';
import { Header } from '@/components/layout/header';
import React, { useEffect, useState, useMemo } from 'react';
import { type CharacterMetadata } from '@/lib/types';
import { getAllCharacters } from '@/lib/firebase/rtdb';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { CharacterCard } from '@/components/character/character-card'; 

const tagColors: Record<string, string> = {
  "Romantic": "bg-pink-500 hover:bg-pink-600",
  "Funny": "bg-yellow-500 hover:bg-yellow-600",
  "Shy": "bg-purple-500 hover:bg-purple-600",
  "Bold": "bg-red-500 hover:bg-red-600",
  "Bollywood": "bg-orange-500 hover:bg-orange-600",
  "Flirty": "bg-rose-500 hover:bg-rose-600",
  "Witty": "bg-teal-500 hover:bg-teal-600",
  "Cultured": "bg-indigo-500 hover:bg-indigo-600",
  "Techie": "bg-sky-500 hover:bg-sky-600",
  "Foodie": "bg-lime-500 hover:bg-lime-600",
  "Philosophical": "bg-slate-500 hover:bg-slate-600",
  "Traveler": "bg-cyan-500 hover:bg-cyan-600",
  "Musician": "bg-violet-500 hover:bg-violet-600",
  "Artist": "bg-emerald-500 hover:bg-emerald-600",
  "Poetic": "bg-fuchsia-500 hover:bg-fuchsia-600",
  "Intellectual": "bg-blue-500 hover:bg-blue-600",
  "Spiritual": "bg-amber-500 hover:bg-amber-600",
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
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg font-body">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50 text-foreground">
      <Header />

      <section className="container mx-auto px-4 pt-20 md:pt-22 pb-8 flex-grow">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold font-headline mb-3 text-primary animate-fade-in">
            Kaun Banegi Aapki Virtual Crush? <Sparkles className="inline-block text-accent h-10 w-10" />
          </h2>
          <p className="text-lg md:text-xl font-body text-muted-foreground animate-slide-in-from-bottom">
            Pick your vibe! Har AI ka apna alag andaaz hai. Chalo, dhoondte hain aapki perfect match!
          </p>
        </div>

        <div className="mb-8 p-4 bg-card/80 backdrop-blur-sm rounded-xl shadow-lg space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 sticky top-16 md:top-18 z-30">
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="Search by name or personality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full !rounded-lg text-sm md:text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-5 w-5 text-primary mr-1 hidden xs:inline-block sm:inline-block" />
            <span className="text-sm font-medium text-muted-foreground mr-2 hidden xs:inline-block sm:inline-block">Filter by Tags:</span>
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTag(tag)}
                className={`rounded-full text-xs px-3 py-1 transition-all duration-200 ease-in-out transform hover:scale-105 
                            ${selectedTags.includes(tag) ? 
                              `${tagColors[tag] || 'bg-primary'} text-primary-foreground shadow-md` : 
                              'border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/70 bg-background/50'
                            }`}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {loadingCharacters ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="bg-card shadow-xl rounded-2xl overflow-hidden aspect-[3/5] flex flex-col">
                <Skeleton className="w-full h-3/5" /> 
                <div className="p-5 text-center space-y-2 flex-grow flex flex-col justify-between">
                  <div>
                    <Skeleton className="h-7 w-3/4 mx-auto mb-1.5" />
                    <Skeleton className="h-10 w-full mx-auto mb-3" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
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
          <div className="text-center py-12">
            <h3 className="text-2xl font-headline text-primary mb-3">Oops! Koi nahi mila... 😟</h3>
            <p className="text-muted-foreground font-body mb-6">
              {searchTerm || selectedTags.length > 0 ? "Try adjusting your search or filters. Shayad aapki perfect match thodi alag hai!" : "No characters available right now. Hum jald hi naye AI Baes add karenge!"}
            </p>
            { (searchTerm || selectedTags.length > 0) &&
                <Button onClick={() => { setSearchTerm(''); setSelectedTags([]); }} variant="outline" className="rounded-lg">Clear Filters</Button>
            }
          </div>
        )}

        <div className="mt-16 text-center">
            <Link href="/admin/login" passHref>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary rounded-lg text-xs">
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Admin Panel
              </Button>
            </Link>
        </div>
      </section>

      <footer className="py-6 text-center border-t border-border/20 bg-background/30">
        <p className="text-sm text-muted-foreground font-body">&copy; {new Date().getFullYear()} DesiVerse Bae. Made with <Heart className="inline h-4 w-4 text-primary animate-heartbeat" /> in India.</p>
      </footer>
    </div>
  );
}
