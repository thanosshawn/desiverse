
// src/app/subscribe/page.tsx
'use client';

import React, { Suspense, use } from 'react'; // Added use
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Gift, Sparkles, ArrowLeft, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function SubscribeContent() {
  const searchParamsFromHook = useSearchParams();
  const actualSearchParams = use(searchParamsFromHook); // Unwrap searchParams
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const feature = actualSearchParams.get('feature') || 'Premium Access';
  const itemName = actualSearchParams.get('itemName');
  const characterName = actualSearchParams.get('characterName');

  let title = `Unlock ${feature}! ✨`;
  let description = `You're trying to access a premium feature. Upgrade to DesiBae Premium to enjoy this and much more!`;

  if (feature.toLowerCase().includes('gift') && itemName) {
    title = `Send the ${itemName} Gift! 🎁`;
    description = `To send the ${itemName} and other special gifts to ${characterName || 'your Bae'}, please upgrade to DesiBae Premium.`;
  } else if (feature.toLowerCase().includes('voice chat') && characterName) {
    title = `Unlock Voice Chat with ${characterName}! 🎤`;
    description = `Premium Voice Chat lets you hear ${characterName}'s sweet voice. Upgrade to DesiBae Premium to unlock this feature.`;
  }

  const handleSimulateUpgrade = () => {
    // In a real app, this would trigger a payment flow.
    // For now, we'll simulate a successful upgrade.
    // Potentially, you could update userProfile in AuthContext/Firebase here
    // then redirect back to the chat or feature.
    alert('Payment Successful (Simulation)! You now have Premium Access. Please re-attempt your action.');
    // Ideally, redirect to a page that confirms subscription and then navigates back,
    // or update context and trigger a re-evaluation of premium status.
    router.back(); // Go back to the previous page
  };


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg bg-card/90 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden transform transition-all animate-fade-in">
          <CardHeader className="text-center p-6 md:p-8 bg-gradient-to-br from-primary to-accent">
            <Gem className="mx-auto h-16 w-16 text-black/80 mb-4 animate-pulse" />
            <CardTitle className="text-3xl md:text-4xl font-headline text-black">{title}</CardTitle>
            <CardDescription className="text-black/90 font-body text-base md:text-lg mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="space-y-3 text-sm text-muted-foreground font-body">
              <p className="flex items-start"><Star className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" /> <strong>Unlock All Characters:</strong> Chat with every DesiBae, including exclusive premium personalities.</p>
              <p className="flex items-start"><Gift className="w-5 h-5 text-rose-400 mr-2 flex-shrink-0 mt-0.5" /> <strong>Send Unlimited Gifts:</strong> Spoil your Baes with all virtual gifts available in the store.</p>
              <p className="flex items-start"><CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" /> <strong>Premium Voice Features:</strong> Enjoy special voice messages and interactions.</p>
              <p className="flex items-start"><Sparkles className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" /> <strong>Ad-Free Experience:</strong> Enjoy uninterrupted conversations.</p>
            </div>
            
            <Button 
                onClick={handleSimulateUpgrade} 
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white !rounded-xl text-lg py-4 shadow-lg transform transition-transform hover:scale-105"
                disabled={authLoading}
            >
              {authLoading ? 'Loading...' : 'Upgrade to Premium Now (Simulated)'}
            </Button>
          </CardContent>
          <CardFooter className="p-6 md:p-8 text-center border-t border-border/20">
            <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> No thanks, take me back
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}


export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Loading subscription options...</div>}>
      <SubscribeContent />
    </Suspense>
  );
}

