
// src/app/subscribe/page.tsx
'use client';

import React, { Suspense, useState, useActionState } from 'react'; 
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Gift, Sparkles, ArrowLeft, Star, CheckCircle, Zap, Loader2 } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { processSubscriptionUpgrade, type SubscriptionUpgradeState } from '../actions';
import { useToast } from '@/hooks/use-toast';

const initialSubscriptionState: SubscriptionUpgradeState = {
  success: false,
  message: '',
};

function SubscribeContent() {
  const searchParams = useSearchParams(); 
  const router = useRouter();
  const { user, loading: authLoading, userProfile } = useAuth();
  const { toast } = useToast();
  
  // useActionState for handling the server action
  const [state, formAction, isPending] = useActionState(
    async (prevState: SubscriptionUpgradeState, formData: FormData) => {
      if (!user?.uid) {
          toast({ title: "Login Required", description: "Please log in to upgrade your subscription.", variant: "destructive"});
          router.push('/login?redirect=/subscribe'); // Redirect to login
          return { success: false, message: "User not logged in."};
      }
      const result = await processSubscriptionUpgrade(user.uid);
      if (result.success) {
        toast({
          title: "Upgrade Successful! 💖",
          description: result.message,
          variant: "default",
          duration: 5000,
        });
        // AuthContext will eventually pick up the change on next profile fetch or reload
        // For immediate UI update reflecting premium, typically the AuthContext would need a manual refresh trigger
        // or the app would rely on the user navigating away and back, or a full reload.
        router.back(); // Or router.push('/profile') or similar
      } else {
        toast({
          title: "Upgrade Failed 😔",
          description: result.message,
          variant: "destructive",
        });
      }
      return result;
    },
    initialSubscriptionState
  );


  const feature = searchParams.get('feature') || 'Premium Access';
  const itemName = searchParams.get('itemName');
  const characterNameParam = searchParams.get('characterName'); 

  let title = `Unlock ${feature}! ✨`;
  let description = `You're trying to access a premium feature. Upgrade to DesiBae Premium to enjoy this and much more!`;

  if (feature.toLowerCase().includes('gift') && itemName) {
    title = `Send the ${itemName} Gift! 🎁`;
    description = `To send the ${itemName} and other special gifts to ${characterNameParam || 'your Bae'}, please upgrade to DesiBae Premium. Spoil them with love!`;
  } else if (feature.toLowerCase().includes('voice messages') && characterNameParam) { 
    title = `Unlock Voice Chat with ${characterNameParam}! 🎤`;
    description = `Premium Voice Chat lets you hear ${characterNameParam}'s sweet voice. Upgrade to DesiBae Premium to unlock this feature and get closer.`;
  }


  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10 items-center justify-center">
        <Header />
        <Loader2 className="h-16 w-16 animate-spin text-primary"/>
        <p className="mt-3 text-lg text-muted-foreground">Loading your details...</p>
      </div>
    )
  }

  if (userProfile?.subscriptionTier === 'premium' || userProfile?.subscriptionTier === 'spicy') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
           <Card className="w-full max-w-lg bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden transform transition-all animate-fade-in border-2 border-green-500/50">
             <CardHeader className="text-center p-6 md:p-8 bg-gradient-to-br from-green-500 via-teal-500 to-emerald-600">
                <CheckCircle className="mx-auto h-16 w-16 text-white mb-4 animate-pulse" />
                <CardTitle className="text-3xl md:text-4xl font-headline text-white">You're Already Premium! 🎉</CardTitle>
                <CardDescription className="text-white/95 font-body text-base md:text-lg mt-2">
                  Thanks for being a DesiBae Premium member! All features are unlocked for you.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
                <p className="text-center text-muted-foreground">You can continue enjoying all the exclusive content and features. Happy chatting!</p>
            </CardContent>
            <CardFooter className="p-6 md:p-8 text-center border-t border-border/20 bg-card/80">
                 <Button variant="default" onClick={() => router.back()} className="w-full !rounded-xl bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground shadow-lg hover:shadow-primary/30">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back & Enjoy!
                </Button>
            </CardFooter>
           </Card>
        </main>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden transform transition-all animate-fade-in border-2 border-primary/30">
          <CardHeader className="text-center p-6 md:p-8 bg-gradient-to-br from-primary via-rose-500 to-pink-600">
            <Gem className="mx-auto h-16 w-16 text-yellow-300 mb-4 animate-pulse-spinner" />
            <CardTitle className="text-3xl md:text-4xl font-headline text-white drop-shadow-md">{title}</CardTitle>
            <CardDescription className="text-white/95 font-body text-base md:text-lg mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <ul className="space-y-3 text-sm text-card-foreground font-body list-none p-0">
              <li className="flex items-start"><Star className="w-5 h-5 text-yellow-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Unlock All Characters:</strong> Chat with every DesiBae, including exclusive premium personalities.</li>
              <li className="flex items-start"><Gift className="w-5 h-5 text-rose-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Send Unlimited Gifts:</strong> Spoil your Baes with all virtual gifts available in the store.</li>
              <li className="flex items-start"><CheckCircle className="w-5 h-5 text-green-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Premium Voice Features:</strong> Enjoy special voice messages and interactions.</li>
              <li className="flex items-start"><Zap className="w-5 h-5 text-purple-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Priority AI Responses:</strong> Get faster replies during peak times.</li>
              <li className="flex items-start"><Sparkles className="w-5 h-5 text-teal-400 mr-2.5 flex-shrink-0 mt-0.5" /> <strong>Ad-Free Experience:</strong> Enjoy uninterrupted conversations.</li>
            </ul>
            
            <form action={formAction}>
                <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 via-teal-500 to-emerald-600 hover:from-green-600 hover:to-teal-600 text-white !rounded-xl text-lg py-3.5 shadow-lg transform transition-transform hover:scale-105 focus:ring-2 ring-green-400 ring-offset-2 ring-offset-card"
                    disabled={isPending || authLoading}
                >
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : 'Upgrade to Premium Now'}
                </Button>
            </form>
            {state.message && !state.success && (
                <p className="text-sm text-destructive text-center mt-2">{state.message}</p>
            )}
          </CardContent>
          <CardFooter className="p-6 md:p-8 text-center border-t border-border/20 bg-card/80">
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
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 items-center justify-center">
        <Header />
        <Loader2 className="h-16 w-16 animate-spin text-primary"/>
        <p className="mt-3 text-lg text-muted-foreground">Loading subscription options...</p>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}
