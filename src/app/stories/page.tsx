// src/app/stories/page.tsx - Story Listing Page
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, BookHeart, Sparkles, Filter } from 'lucide-react';
import { Header } from '@/components/layout/header';
import React, { useEffect, useState, useMemo, Suspense } from 'react';
import type { InteractiveStory, CharacterMetadata } from '@/lib/types';
import { getAllInteractiveStories, getAllCharacters } from '@/lib/firebase/rtdb';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const tagColors: Record<string, string> = {
  "Adventure": "bg-sky-500 hover:bg-sky-600",
  "Romance": "bg-pink-500 hover:bg-pink-600",
  "Mystery": "bg-purple-500 hover:bg-purple-600",
  "Thriller": "bg-red-500 hover:bg-red-600",
  "Sci-Fi": "bg-indigo-500 hover:bg-indigo-600",
  "Fantasy": "bg-emerald-500 hover:bg-emerald-600",
  "Comedy": "bg-yellow-500 hover:bg-yellow-600 text-black",
  "Drama": "bg-slate-500 hover:bg-slate-600",
};


function StoryListingContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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
    if (!authLoading) { // Fetch data only after auth state is resolved
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
      const matchesSearchTerm = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                story.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (characters[story.characterId]?.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => story.tags?.includes(tag));
      return matchesSearchTerm && matchesTags;
    });
  }, [stories, searchTerm, selectedTags, characters]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (authLoading) { // Show loader if auth is still loading
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
            Choose Your Adventure <BookHeart className="inline-block text-accent h-10 w-10" />
          </h2>
          <p className="text-lg md:text-xl font-body text-muted-foreground animate-slide-in-from-bottom">
            Dive into interactive stories and shape the narrative with your Desi Bae!
          </p>
        </div>

        <div className="mb-8 p-4 bg-card/80 backdrop-blur-sm rounded-xl shadow-lg space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 sticky top-16 md:top-18 z-30">
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="Search stories by title, description, or character..."
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

        {loadingData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="bg-card shadow-xl rounded-2xl overflow-hidden aspect-[16/10] flex flex-col">
                <Skeleton className="w-full h-3/5" />
                <div className="p-5 space-y-2 flex-grow flex flex-col justify-between">
                  <div>
                    <Skeleton className="h-7 w-3/4 mb-1.5" />
                    <Skeleton className="h-10 w-full mb-3" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </Skeleton>
            ))}
          </div>
        ) : filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
            {filteredStories.map((story) => (
              <Card key={story.id} className="bg-card shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-300 flex flex-col group hover:shadow-primary/30 animate-fade-in">
                <CardHeader className="p-0 relative w-full aspect-[16/9]">
                  <Image
                    src={story.coverImageUrl || `https://placehold.co/600x338.png?text=${encodeURIComponent(story.title)}`}
                    alt={story.title}
                    fill
                    className="object-cover group-hover:brightness-110 transition-all duration-300"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                  />
                </CardHeader>
                <CardContent className="p-5 flex flex-col flex-grow">
                  <CardTitle className="text-xl text-primary mb-1 font-headline line-clamp-2">{story.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-2 line-clamp-3 flex-grow">{story.description}</CardDescription>
                   <p className="text-xs text-muted-foreground/80 mb-3">With: <span className="font-semibold text-accent">{characters[story.characterId]?.name || 'Mysterious Bae'}</span></p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {story.tags?.slice(0, 4).map(tag => (
                      <Badge
                        key={tag}
                        variant="default"
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[tag] || 'bg-secondary'} text-secondary-foreground`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Link href={user ? `/story/${story.id}` : `/login?redirect=/story/${story.id}`} passHref className="mt-auto">
                    <Button
                      variant="default"
                      className="w-full text-primary-foreground rounded-xl text-base py-2.5 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 group-hover:animate-heartbeat bg-gradient-to-br from-rose-400 via-orange-300 to-amber-300 hover:from-rose-500 hover:via-orange-400 hover:to-amber-400 hover:shadow-orange-500/50"
                    >
                      <BookHeart className="mr-2 h-5 w-5" /> Play Story
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-2xl font-headline text-primary mb-3">No Stories Found... Yet! 😟</h3>
            <p className="text-muted-foreground font-body mb-6">
              {searchTerm || selectedTags.length > 0 ? "Try adjusting your search or filters. More stories coming soon!" : "No interactive stories available right now. Check back soon!"}
            </p>
            { (searchTerm || selectedTags.length > 0) &&
                <Button onClick={() => { setSearchTerm(''); setSelectedTags([]); }} variant="outline" className="rounded-lg">Clear Filters</Button>
            }
             <Link href="/" className="mt-4 ml-2">
                <Button variant="default" className="!rounded-xl">Chat with Baes</Button>
            </Link>
          </div>
        )}
      </section>

      <footer className="py-6 text-center border-t border-border/20 bg-background/30">
        <p className="text-sm text-muted-foreground font-body">&copy; {new Date().getFullYear()} DesiVerse Bae. Made with <Sparkles className="inline h-4 w-4 text-primary animate-pulse" /> in India.</p>
      </footer>
    </div>
  );
}

export default function StoryListPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="ml-4 text-lg font-body">Loading stories...</p>
                </div>
            </div>
        }>
            <StoryListingContent />
        </Suspense>
    );
}
