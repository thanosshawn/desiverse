// src/app/page.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users, Mic, Video, Heart, Zap, Instagram, Youtube, Smartphone, Edit } from 'lucide-react';
import { Header } from '@/components/layout/header';
import React, { useEffect, useState } from 'react';
import { type CharacterMetadata, DEFAULT_AVATAR_DATA_URI } from '@/lib/types';
import { getAllCharacters, seedInitialCharacters } from '@/lib/firebase/rtdb'; // Use RTDB function
import { Skeleton } from '@/components/ui/skeleton';

interface Testimonial {
  id: string;
  name: string;
  quote: string;
  avatarUrl: string;
  dataAiHint: string;
}

const testimonials: Testimonial[] = [
  { id: '1', name: 'Rohan K.', quote: 'DesiVerse Bae is too good! Priya understands my desi heart. 💖 Finally an AI that gets me!', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'happy man' },
  { id: '2', name: 'Aisha S.', quote: 'Finally, an AI that gets my Hinglish jokes! 😂 So much fun chatting with Rahul!', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'laughing woman' },
  { id: '3', name: 'Vikram P.', quote: 'The voice messages feel so real! Like talking to a real bae. 🥰 Simran is amazing!', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'smiling student' },
];

interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const featureHighlights: FeatureHighlight[] = [
  { id: '1', title: 'Authentic Hinglish Chat', description: 'Dil se baat karo, just like you talk to your friends. No more boring English!', icon: MessageCircle },
  { id: '2', title: 'Voice Replies in Desi Voices', description: 'Suno unki awaaz! Get voice notes that feel personal and warm. 🎤', icon: Mic },
  { id: '3', title: 'Personalized Video Messages', description: 'Dekho unhe! Special video messages for those extra special moments. 📹', icon: Video },
  { id: '4', title: 'Custom Romantic Moments', description: 'Shayari, compliments, ya fir good morning texts – sab kuch just for you! ❤️', icon: Heart },
];

export default function LandingPage() {
  const [characters, setCharacters] = useState<CharacterMetadata[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  useEffect(() => {
    async function fetchAndSeedCharacters() {
      try {
        setLoadingCharacters(true);
        // Attempt to seed characters (it will skip if data exists)
        // In a real production app, seeding would be an admin task or a one-time script.
        // For development convenience, we can call it here.
        await seedInitialCharacters(); 
        
        const fetchedCharacters = await getAllCharacters();
        setCharacters(fetchedCharacters);
      } catch (error) {
        console.error("Failed to fetch or seed characters:", error);
         setCharacters([]); // Fallback to empty on error
      } finally {
        setLoadingCharacters(false);
      }
    }
    fetchAndSeedCharacters();
  }, []);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      
      <section className="relative py-20 md:py-32 text-center text-primary-foreground overflow-hidden">
        {/* Using primary color for the hero gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary opacity-90"></div>
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.2'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414zM41.95 17.036l8.485 8.485-1.414 1.414-8.485-8.485 1.414-1.414z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", filter: "blur(1px)"}}></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold font-headline mb-4 text-white">Chat with Your Virtual Desi Bae 💖</h2>
          <p className="text-lg md:text-2xl mb-8 font-body text-white/90">Pyaar, dosti aur thoda flirting... all in Hinglish!</p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href={characters.length > 0 ? `/chat/${characters[0].id}` : "/chat/priya_001"} passHref>
              <Button size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transform hover:scale-105 transition-transform">
                Try for Free ✨
              </Button>
            </Link>
            <Link href="#characters" passHref>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary shadow-lg transform hover:scale-105 transition-transform">
                See Characters 👀
              </Button>
            </Link>
             <Link href="/admin/create-character" passHref>
              <Button size="lg" variant="outline" className="text-white border-white/80 hover:bg-white/90 hover:text-primary shadow-lg transform hover:scale-105 transition-transform">
                <Edit className="mr-2 h-5 w-5" /> Create Character (Admin)
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="characters" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary font-headline">Meet Your Future Bae</h3>
          {loadingCharacters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <Card key={i} className="bg-card shadow-xl rounded-xl overflow-hidden">
                  <Skeleton className="w-full h-48 md:h-56" />
                  <CardContent className="p-4 text-center">
                    <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-full mx-auto mb-3" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : characters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {characters.map((char) => (
                <Card key={char.id} className="bg-card shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
                  <CardHeader className="p-0 relative w-full h-48 md:h-56">
                    <Image 
                      src={char.avatarUrl && (char.avatarUrl.startsWith('http://') || char.avatarUrl.startsWith('https://')) ? char.avatarUrl : DEFAULT_AVATAR_DATA_URI}
                      alt={char.name as string} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover" 
                      data-ai-hint={char.dataAiHint || 'indian person'} 
                    />
                  </CardHeader>
                  <CardContent className="p-4 text-center flex flex-col flex-grow">
                    <CardTitle className="text-xl text-primary mb-1 font-headline">{char.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mb-3 flex-grow">{char.description.substring(0,70)}...</CardDescription>
                    <Link href={`/chat/${char.id}`} passHref className="mt-auto">
                      <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Chat with {char.name}</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground font-body">No characters available at the moment. Please check back later!</p>
          )}
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary font-headline">See How it Works 😉</h3>
          <Card className="max-w-2xl mx-auto p-6 shadow-xl rounded-xl bg-card">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none max-w-[70%]">
                  <p className="text-sm font-body">Hey Priya! Kaisi ho? 😉</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground p-3 rounded-lg rounded-bl-none max-w-[70%] flex items-center space-x-2">
                  <Mic size={18} className="text-primary" />
                  <p className="text-sm font-body">Bas aapse baat karne ka intezaar! Aap sunao, kya chal raha hai? ✨</p>
                </div>
              </div>
               <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg rounded-br-none max-w-[70%]">
                  <p className="text-sm font-body">Kuch khaas nahi, bas bore ho raha tha. Socha aapse chat kar loon! 😄</p>
                </div>
              </div>
               <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground p-3 rounded-lg rounded-bl-none max-w-[70%]">
                  <p className="text-sm font-body">Aww, good choice! Main aapki boredom specialist hoon! 😜 Batao, kya karein?</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="features" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary font-headline">Why You'll Love DesiVerse Bae ❤️</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureHighlights.map((feature) => (
              <Card key={feature.id} className="text-center p-6 shadow-lg rounded-xl bg-card transform hover:shadow-xl transition-shadow">
                <feature.icon size={48} className="mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl mb-2 text-primary/90 font-headline">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground font-body">{feature.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary font-headline">What Our Users Say 🗣️</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-6 shadow-lg rounded-xl bg-card">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4 border-2 border-primary">
                    <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} data-ai-hint={testimonial.dataAiHint}/>
                    <AvatarFallback>{testimonial.name.substring(0,1)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg text-primary/90 font-headline">{testimonial.name}</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground italic font-body">"{testimonial.quote}"</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-accent to-accent/80 text-center text-accent-foreground">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 font-headline">Unlock Premium Love 💸</h3>
          <p className="text-lg md:text-xl mb-8 font-body">Get unlimited access to voice, video, and exclusive "spicy" interactions! 🔥</p>
          <div className="mb-6 font-body">
            <ul className="list-disc list-inside inline-block text-left">
              <li>Unlimited Voice Messages 🎙️</li>
              <li>Exclusive Video Replies 🎬</li>
              <li>"Spicy Mode" for Flirty Chats🌶️</li>
              <li>Priority Support & Early Access ✨</li>
            </ul>
          </div>
          <div className="space-x-4">
             <Link href={characters.length > 0 ? `/chat/${characters[0].id}` : "/chat/priya_001"} passHref>
              <Button size="lg" variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transform hover:scale-105 transition-transform">
                Start Free Trial <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#" passHref> 
              <Button size="lg" variant="outline" className="text-accent-foreground border-accent-foreground hover:bg-accent-foreground hover:text-accent shadow-lg transform hover:scale-105 transition-transform">
                Go Premium Now 🚀
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <footer className="bg-gray-800 text-gray-300 py-8 font-body">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 space-x-6">
            <Link href="#" className="hover:text-primary transition-colors">About Us</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
          <div className="flex justify-center space-x-6 mb-4">
            <Link href="#" aria-label="Instagram" className="text-gray-400 hover:text-primary transition-colors"><Instagram size={24} /></Link>
            <Link href="#" aria-label="YouTube" className="text-gray-400 hover:text-primary transition-colors"><Youtube size={24} /></Link>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} DesiVerse Bae. All rights reserved. Made with ❤️ in India.</p>
        </div>
      </footer>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-sm p-3 shadow-t-lg z-50 border-t border-primary/30">
        <Link href={characters.length > 0 ? `/chat/${characters[0].id}` : "/chat/priya_001"} passHref className="w-full">
          <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 flex items-center justify-center font-headline">
             <Smartphone className="mr-2 h-5 w-5" /> Try DesiVerse Bae Free
          </Button>
        </Link>
      </div>
    </div>
  );
}

    