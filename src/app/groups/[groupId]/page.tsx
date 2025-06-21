// src/app/groups/[groupId]/page.tsx
'use client';

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function GroupChatRoomPage() {

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg bg-card shadow-2xl rounded-3xl overflow-hidden animate-fade-in border-2 border-primary/30 text-center">
          <CardHeader className="p-6 md:p-8">
            <Users className="mx-auto h-16 w-16 text-primary mb-4 animate-pulse" />
            <CardTitle className="text-3xl md:text-4xl font-headline text-primary">Group Chat Coming Soon!</CardTitle>
            <CardDescription className="font-body text-base md:text-lg mt-2 text-muted-foreground">
              This feature is under construction. Soon you'll be able to chat with other users and your favorite Baes together in one place!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <p>We're working hard to bring you an amazing group chat experience. Stay tuned for updates!</p>
          </CardContent>
          <CardFooter className="p-6 md:p-8 border-t border-border/40 bg-muted/30">
            <Link href="/groups" className="w-full">
              <Button variant="default" className="w-full !rounded-xl text-lg py-3">
                Back to All Groups
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
