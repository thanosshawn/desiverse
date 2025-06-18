
// src/components/layout/header.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut, UserCircle, Loader2, MessageSquareText, Settings, History, Sparkles, Users, Globe, Palette, Sun, Moon, Send } from 'lucide-react'; // Added Send icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { usePathname } from 'next/navigation';
import { listenToOnlineUsersCount, listenToTotalRegisteredUsers } from '@/lib/firebase/rtdb';
import { useTheme } from 'next-themes';
import { getInitials } from '@/lib/utils';

export function Header() {
  const { user, userProfile, loading, signInWithGoogle, signInAnonymously, signOut } = useAuth();
  const pathname = usePathname();
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [totalRegisteredCount, setTotalRegisteredCount] = useState(0);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const unsubscribeOnline = listenToOnlineUsersCount(setOnlineUsersCount);
    const unsubscribeTotal = listenToTotalRegisteredUsers(setTotalRegisteredCount);

    return () => {
      unsubscribeOnline();
      unsubscribeTotal();
    };
  }, []);

  const getThemeIcon = () => {
    if (!mounted) return <Palette className="h-5 w-5" />;
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'pink':
        return <Sparkles className="h-5 w-5" />; 
      default:
        return <Palette className="h-5 w-5" />;
    }
  };

  return (
    <header className="bg-gradient-to-br from-pink-400 via-rose-400 via-fuchsia-300 to-orange-300 text-primary-foreground p-3 md:p-4 shadow-lg sticky top-0 z-50 h-16 md:h-18 flex items-center">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" passHref>
            <div className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-7 w-7 md:h-8 md:w-8 animate-pulse" />
              <h1 className="text-2xl md:text-3xl font-headline">DesiBae</h1>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-3 text-xs opacity-80">
            <div className="flex items-center gap-1" title="Online Users">
              <Users className="h-4 w-4" />
              <span>{onlineUsersCount} Online</span>
            </div>
            <div className="flex items-center gap-1" title="Total Registered Users">
              <Globe className="h-4 w-4" />
              <span>{totalRegisteredCount} Total</span>
            </div>
          </div>
        </div>
        <nav className="flex items-center space-x-1 md:space-x-2">
          <Link href="https://t.me/desibaecommunity" target="_blank" passHref>
            <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 rounded-full" title="Join Telegram Group">
              <Send className="h-5 w-5" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 rounded-full" title="Change theme">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground rounded-xl shadow-2xl border-border bg-opacity-100 data-[state=open]:opacity-100">
              <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light" className="cursor-pointer hover:!bg-accent/10 focus:!bg-accent/20 rounded-md">
                  <Sun className="mr-2 h-4 w-4" /> Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" className="cursor-pointer hover:!bg-accent/10 focus:!bg-accent/20 rounded-md">
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pink" className="cursor-pointer hover:!bg-accent/10 focus:!bg-accent/20 rounded-md">
                  <Sparkles className="mr-2 h-4 w-4 text-pink-500" /> Pink
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          ) : user ? (
            <>
              <Link href="/history" passHref>
                <Button variant="ghost" size="icon" className={`hover:bg-primary-foreground/10 ${pathname === '/history' ? 'bg-primary-foreground/20' : ''} rounded-full`} title="Chat History">
                  <History className="h-5 w-5" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                    <Avatar className="h-10 w-10 border-2 border-primary-foreground/30 hover:border-accent transition-colors">
                      <AvatarImage src={userProfile?.avatarUrl || user.photoURL || undefined} alt={userProfile?.name || user.displayName || 'User'} />
                      <AvatarFallback className="bg-pink-200 text-pink-700 font-semibold">{getInitials(userProfile?.name || user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover text-popover-foreground rounded-xl shadow-2xl border-border bg-opacity-100 data-[state=open]:opacity-100" align="end" forceMount>
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
              <DropdownMenuContent className="w-60 bg-popover text-popover-foreground rounded-xl shadow-2xl border-border bg-opacity-100 data-[state=open]:opacity-100" align="end" forceMount>
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
