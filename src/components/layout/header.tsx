// src/components/layout/header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut, UserCircle, Loader2, MessageSquareText, Settings, History, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from 'next/navigation';

export function Header() {
  const { user, userProfile, loading, signInWithGoogle, signInAnonymously, signOut } = useAuth();
  const pathname = usePathname();

  const getInitials = (name?: string | null) => {
    if (!name) return 'DB';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-gradient-to-r from-primary via-pink-500 to-rose-600 text-primary-foreground p-3 md:p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" passHref>
          <div className="flex items-center gap-2 cursor-pointer">
            <Sparkles className="h-7 w-7 md:h-8 md:w-8 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-headline">DesiBae</h1>
          </div>
        </Link>
        <nav className="flex items-center space-x-2 md:space-x-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          ) : user ? (
            <>
              <Link href="/history" passHref>
                <Button variant="ghost" size="icon" className={`hover:bg-primary-foreground/10 ${pathname === '/history' ? 'bg-primary-foreground/20' : ''}`} title="Chat History">
                  <History className="h-5 w-5" />
                </Button>
              </Link>
              {/* Placeholder for future daily love note / premium features */}
              {/* <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10" title="Daily Spark">
                <HeartCrack className="h-5 w-5" />
              </Button> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                    <Avatar className="h-10 w-10 border-2 border-primary-foreground/30 hover:border-accent transition-colors">
                      <AvatarImage src={userProfile?.avatarUrl || user.photoURL || undefined} alt={userProfile?.name || user.displayName || 'User'} />
                      <AvatarFallback className="bg-pink-200 text-pink-700 font-semibold">{getInitials(userProfile?.name || user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card text-card-foreground rounded-xl shadow-2xl border-border" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1 p-1">
                      <p className="text-sm font-medium leading-none">
                        {userProfile?.name || user.displayName || 'Desi User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email || (user.isAnonymous ? 'Guest User' : 'No email')}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild className="cursor-pointer hover:!bg-accent/10 focus:!bg-accent/20 rounded-md">
                    <Link href="/">
                      <MessageSquareText className="mr-2 h-4 w-4 text-primary" /> Characters
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:!bg-accent/10 focus:!bg-accent/20 rounded-md">
                    <Link href="/history">
                      <History className="mr-2 h-4 w-4 text-primary" /> Chat History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:!bg-accent/10 focus:!bg-accent/20 rounded-md">
                     <Link href="/settings">
                       <Settings className="mr-2 h-4 w-4 text-primary" /> Settings
                     </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50"/>
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:!text-destructive focus:!bg-destructive/10 rounded-md">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg shadow-md px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base">
                  <UserCircle className="mr-1.5 h-5 w-5" /> Login / Sign Up
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 bg-card text-card-foreground rounded-xl shadow-2xl border-border" align="end" forceMount>
                 <DropdownMenuLabel className="text-center text-muted-foreground text-sm py-2 px-2">Chalo, milte hain tumhari virtual crush se 😍</DropdownMenuLabel>
                 <DropdownMenuSeparator className="bg-border/50"/>
                <DropdownMenuItem onClick={signInWithGoogle} className="cursor-pointer group py-2.5 px-3 hover:!bg-accent/10 focus:!bg-accent/20 rounded-md">
                  <LogIn className="mr-2 h-4 w-4 text-primary group-hover:text-accent-foreground" /> Sign in with Google
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signInAnonymously} className="cursor-pointer group py-2.5 px-3 hover:!bg-accent/10 focus:!bg-accent/20 rounded-md">
                  <UserCircle className="mr-2 h-4 w-4 text-primary group-hover:text-accent-foreground" /> Continue as Guest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
