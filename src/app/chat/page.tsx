// src/app/chat/page.tsx (Old file - can be deleted or repurposed)
// For now, let's make it a redirect or a character selection placeholder
// This file will be effectively replaced by src/app/chat/[characterId]/page.tsx

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function ChatRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the homepage or a default character.
    // For now, let's redirect to homepage as character selection is there.
    router.replace('/');
  }, [router]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground items-center justify-center">
      <Header />
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading DesiBae chats...</p>
      </div>
    </div>
  );
}
