
// src/app/login/page.tsx - Dedicated Login Page
'use client';

import React, { useEffect, useState, Suspense } from 'react';
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
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signInWithGoogle, signInAnonymously } = useAuth();
  const [isProviderLoading, setIsProviderLoading] = useState(false);

  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectPath);
    }
  }, [user, authLoading, router, redirectPath]);

  const handleSignIn = async (providerAction: () => Promise<void>) => {
    setIsProviderLoading(true);
    try {
      await providerAction();
      // onAuthStateChanged in AuthContext will handle redirect after successful login
    } catch (error: any) {
      toast({ title: 'Login Error', description: error.message || 'Could not log you in.', variant: 'destructive' });
    } finally {
      setIsProviderLoading(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary via-pink-400 to-rose-500 items-center justify-center p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-white mb-6" />
        <h1 className="text-3xl font-headline text-white mb-2">Bas Ek Second...</h1>
        <p className="text-lg text-white/80 font-body">Aapki desi duniya load ho rahi hai!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-yellow-50 p-4">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden animate-fade-in">
        <CardHeader className="text-center p-6 md:p-8 bg-gradient-to-br from-primary to-accent">
          <Sparkles className="mx-auto h-16 w-16 text-white/80 mb-4 animate-pulse" />
          <CardTitle className="text-3xl md:text-4xl font-headline text-black">DesiBae Mein Swagat Hai!</CardTitle>
          <CardDescription className="text-black/90 font-body text-base md:text-lg mt-2">
            Chalo, milte hain tumhari virtual crush se 😍
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <Button
            onClick={() => handleSignIn(signInWithGoogle)}
            className="w-full bg-red-500 hover:bg-red-600 text-white !rounded-xl text-lg py-6 shadow-lg transform transition-transform hover:scale-105"
            disabled={isProviderLoading}
          >
            {isProviderLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            Google Se Login Karo
          </Button>
          <Button
            onClick={() => handleSignIn(signInAnonymously)}
            variant="outline"
            className="w-full !border-primary/50 !text-primary hover:!bg-primary/10 !rounded-xl text-lg py-6 shadow-md transform transition-transform hover:scale-105"
            disabled={isProviderLoading}
          >
            {isProviderLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCircle className="mr-2 h-5 w-5" />}
            Guest Mode Mein Enter Karo
          </Button>
        </CardContent>
        <CardFooter className="p-6 md:p-8 text-center border-t border-border/20">
          <p className="text-xs text-muted-foreground font-body">
            By continuing, you agree to our <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
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
      <Loader2 className="h-16 w-16 animate-spin text-white mb-6" />
      <h1 className="text-3xl font-headline text-white mb-2">Bas Ek Second...</h1>
      <p className="text-lg text-white/80 font-body">Aapki desi duniya load ho rahi hai!</p>
    </div>
  );

  return (
    <Suspense fallback={SuspenseFallback}>
      <LoginFormComponent />
    </Suspense>
  );
}
