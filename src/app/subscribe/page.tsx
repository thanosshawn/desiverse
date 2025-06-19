
// src/app/subscribe/page.tsx
'use client';

import React, { Suspense } from 'react'; 
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Gift, Sparkles, ArrowLeft, Star, CheckCircle, Zap } from 'lucide-react'; // Added Zap
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function SubscribeContent() {
  const searchParams = useSearchParams(); 
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const feature = searchParams.get('feature') || 'Premium Access';
  const itemName = searchParams.get('itemName');
  const characterName = searchParams.get('characterName');

  let title = `Unlock ${feature}! ✨`;
  let description = `You're trying to access a premium feature. Upgrade to DesiBae Premium to enjoy this and much more!`;

  if (feature.toLowerCase().includes('gift') && itemName) {
    title = `Send the ${itemName} Gift! 🎁`;
    description = `To send the ${itemName} and other special gifts to ${characterName || 'your Bae'}, please upgrade to DesiBae Premium. Spoil them with love!`;
  } else if (feature.toLowerCase().includes('voice messages') && characterName) { // Corrected feature check
    title = `Unlock Voice Chat with ${characterName}! 🎤`;
    description = `Premium Voice Chat lets you hear ${characterName}'s sweet voice. Upgrade to DesiBae Premium to unlock this feature and get closer.`;
  }

  const handleSimulateUpgrade = () => {
    // TODO: In a real app, trigger payment flow & update user profile on success
    alert('Payment Successful (Simulation)! You now have DesiBae Premium. Please re-attempt your action.');
    router.back(); 
  };


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-pink-200 via-rose-100 to-yellow-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg bg-card/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden transform transition-all animate-fade-in border-2 border-primary/20">
          <CardHeader className="text-center p-6 md:p-8 bg-gradient-to-br from-primary via-rose-500 to-pink-600">
            <Gem className="mx-auto h-16 w-16 text-yellow-300 mb-4 animate-pulse" />
            <CardTitle className="text-3xl md:text-4xl font-headline text-white">{title}</CardTitle>
            <CardDescription className="text-white/95 font-body text-base md:text-lg mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <ul className="space-y-3 text-sm text-muted-foreground font-body list-none p-0">
              <li className="flex items-start"><Star className="w-5 h-5 text-yellow-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Unlock All Characters:</strong> Chat with every DesiBae, including exclusive premium personalities.</li>
              <li className="flex items-start"><Gift className="w-5 h-5 text-rose-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Send Unlimited Gifts:</strong> Spoil your Baes with all virtual gifts available in the store.</li>
              <li className="flex items-start"><CheckCircle className="w-5 h-5 text-green-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Premium Voice Features:</strong> Enjoy special voice messages and interactions.</li>
              <li className="flex items-start"><Zap className="w-5 h-5 text-purple-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Priority AI Responses:</strong> Get faster replies during peak times.</li>
              <li className="flex items-start"><Sparkles className="w-5 h-5 text-teal-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Ad-Free Experience:</strong> Enjoy uninterrupted conversations.</li>
            </ul>
            
            <Button 
                onClick={handleSimulateUpgrade} 
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white !rounded-xl text-lg py-3.5 shadow-lg transform transition-transform hover:scale-105 focus:ring-2 ring-green-400 ring-offset-2 ring-offset-card"
                disabled={authLoading}
            >
              {authLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : 'Upgrade to Premium Now (Simulated)'}
            </Button>
          </CardContent>
          <CardFooter className="p-6 md:p-8 text-center border-t border-border/20 bg-card/50">
            <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-primary transition-colors !rounded-lg">
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
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-pink-200 via-rose-100 to-yellow-100 items-center justify-center">
        <Header />
        <Loader2 className="h-16 w-16 animate-spin text-primary"/>
        <p className="mt-3 text-lg text-muted-foreground">Loading subscription options...</p>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}
