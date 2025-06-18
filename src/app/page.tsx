// src/app/page.tsx - Character Selection Page
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Filter, Heart, Loader2, MessageCircle, Sparkles, Star, Edit } from 'lucide-react';
import { Header } from '@/components/layout/header';
import React, { useEffect, useState, useMemo } from 'react';
import { type CharacterMetadata, DEFAULT_AVATAR_DATA_URI } from '@/lib/types';
import { getAllCharacters } from '@/lib/firebase/rtdb';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const tagColors: Record<string, string> = {
  "Romantic": "bg-pink-500 hover:bg-pink-600",
  "Funny": "bg-yellow-500 hover:bg-yellow-600",
  "Shy": "bg-purple-500 hover:bg-purple-600",
  "Bold": "bg-red-500 hover:bg-red-600",
  "Bollywood": "bg-orange-500 hover:bg-orange-600",
  "Flirty": "bg-rose-500 hover:bg-rose-600",
  "Witty": "bg-teal-500 hover:bg-teal-600",
  "Cultured": "bg-indigo-500 hover:bg-indigo-600",
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
            <Filter className="h-5 w-5 text-primary mr-1 hidden md:inline-block" />
            <span className="text-sm font-medium text-muted-foreground mr-2 hidden md:inline-block">Filter by Tags:</span>
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTag(tag)}
                className={`rounded-full text-xs px-3 py-1 transition-all duration-200 ease-in-out transform hover:scale-105 ${selectedTags.includes(tag) ? `${tagColors[tag] || 'bg-primary text-primary-foreground'}` : 'border-primary/50 text-primary hover:bg-primary/10'}`}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {loadingCharacters ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-card shadow-xl rounded-2xl overflow-hidden">
                <Skeleton className="w-full h-60 md:h-72" />
                <CardContent className="p-5 text-center space-y-2">
                  <Skeleton className="h-7 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full mx-auto" />
                  <Skeleton className="h-4 w-5/6 mx-auto mb-3" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredCharacters.map((char) => (
              <Card key={char.id} className="bg-card shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.03] transition-transform duration-300 flex flex-col group hover:shadow-primary/30 animate-fade-in">
                <CardHeader className="p-0 relative w-full aspect-[3/4]">
                  <Image
                    src={char.avatarUrl && (char.avatarUrl.startsWith('http')) ? char.avatarUrl : DEFAULT_AVATAR_DATA_URI}
                    alt={char.name}
                    fill
                    className="object-cover group-hover:brightness-110 transition-all duration-300"
                    data-ai-hint={char.dataAiHint || 'indian person portrait'}
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 23vw"
                  />
                  {char.isPremium && (
                    <Badge variant="default" className="absolute top-3 right-3 bg-accent text-accent-foreground shadow-md animate-heartbeat">
                      <Heart className="w-3 h-3 mr-1.5" /> Premium
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-5 text-center flex flex-col flex-grow">
                  <CardTitle className="text-2xl text-primary mb-1.5 font-headline">{char.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-3 flex-grow min-h-[3em] line-clamp-2">{char.personalitySnippet}</CardDescription>
                  <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                    {char.styleTags.slice(0,3).map(tag => (
                        <Badge key={tag} variant="secondary" className={`text-xs px-2 py-0.5 rounded-md ${tagColors[tag]?.replace('bg-', 'bg-opacity-20 border border-').replace('hover:','text-').replace('500','400') || 'bg-secondary/70 text-secondary-foreground'}`}>{tag}</Badge>
                    ))}
                  </div>
                  <Link href={user ? `/chat/${char.id}` : `/login?redirect=/chat/${char.id}`} passHref className="mt-auto">
                    <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-base py-3 shadow-lg hover:shadow-primary/40 transition-all transform hover:scale-105 group-hover:animate-heartbeat">
                      <MessageCircle className="mr-2 h-5 w-5" /> Chat with {char.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
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
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary rounded-lg">
                <Edit className="mr-2 h-4 w-4" /> Admin Panel
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
