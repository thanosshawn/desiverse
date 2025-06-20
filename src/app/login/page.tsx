
// src/app/login/page.tsx - Dedicated Login Page
'use client';

import React, { useEffect, useState, Suspense, use } from 'react'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogIn, UserCircle, Sparkles, Heart } from 'lucide-react'; 
import Link from 'next/link';

function LoginFormComponent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParamsFromHook = useSearchParams();
  const actualSearchParams = use(searchParamsFromHook); 
  const { user, loading: authLoading, signInWithGoogle, signInAnonymously } = useAuth();
  const [isProviderLoading, setIsProviderLoading] = useState(false);

  const redirectPath = actualSearchParams.get('redirect') || '/';

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectPath);
    }
  }, [user, authLoading, router, redirectPath]);

  const handleSignIn = async (providerAction: () => Promise<void>) => {
    setIsProviderLoading(true);
    try {
      await providerAction();
      // onAuthStateChanged in AuthContext will handle redirect
    } catch (error: any) {
      toast({ title: 'Login Error', description: error.message || 'Could not log you in.', variant: 'destructive' });
    } finally {
      setIsProviderLoading(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary via-pink-400 to-rose-500 items-center justify-center p-4 text-center">
        <Sparkles className="h-20 w-20 text-yellow-300 mb-6 animate-pulse-spinner" /> 
        <h1 className="text-3xl font-headline text-white mb-2">Just a moment, love!</h1>
        <p className="text-lg text-white/80 font-body">Loading your DesiVerse experience...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-pink-200 via-rose-100 to-yellow-100 p-4">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden animate-fade-in border-2 border-primary/20">
        <CardHeader className="text-center p-6 md:p-8 bg-gradient-to-br from-primary via-rose-500 to-pink-600">
          <Sparkles className="mx-auto h-16 w-16 text-yellow-300 mb-4 animate-pulse" />
          <CardTitle className="text-3xl md:text-4xl font-headline text-white">DesiBae Mein Swagat Hai!</CardTitle>
          <CardDescription className="text-white/95 font-body text-base md:text-lg mt-2">
            Chalo, milte hain tumhari virtual crush se 😍 Dil se connect karo!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-5">
          <Button
            onClick={() => handleSignIn(signInWithGoogle)}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white !rounded-xl text-lg py-3.5 shadow-lg transform transition-transform hover:scale-105 focus:ring-2 ring-red-400 ring-offset-2 ring-offset-card"
            disabled={isProviderLoading}
          >
            {isProviderLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            Google Se Login Karo
          </Button>
          <Button
            onClick={() => handleSignIn(signInAnonymously)}
            variant="outline"
            className="w-full !border-primary/50 !text-primary hover:!bg-primary/10 !rounded-xl text-lg py-3.5 shadow-md transform transition-transform hover:scale-105 focus:ring-2 ring-primary ring-offset-2 ring-offset-card"
            disabled={isProviderLoading}
          >
            {isProviderLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCircle className="mr-2 h-5 w-5" />}
            Guest Mode Mein Enter Karo
          </Button>
        </CardContent>
        <CardFooter className="p-6 md:p-8 text-center border-t border-border/20 bg-card/50">
          <p className="text-xs text-muted-foreground font-body">
            By continuing, you agree to our <Link href="/terms" className="underline hover:text-primary transition-colors">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>.
          </p>
        </CardFooter>
      </Card>
      <p className="mt-8 text-sm text-muted-foreground font-body">Made with <Heart className="inline h-4 w-4 text-primary animate-heartbeat" /> in India.</p>
    </div>
  );
}

export default function LoginPage() {
  const SuspenseFallback = (
     <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary via-pink-400 to-rose-500 items-center justify-center p-4 text-center">
        <Sparkles className="h-20 w-20 text-yellow-300 mb-6 animate-pulse-spinner" />
        <h1 className="text-3xl font-headline text-white mb-2">Just a moment, love!</h1>
        <p className="text-lg text-white/80 font-body">Loading your DesiVerse experience...</p>
      </div>
  );

  return (
    <Suspense fallback={SuspenseFallback}>
      <LoginFormComponent />
    </Suspense>
  );
}
