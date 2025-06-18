// src/components/layout/header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut, UserCircle, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, userProfile, loading, signInWithGoogle, signInAnonymously, signOut } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return 'DB';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" passHref>
          <h1 className="text-2xl md:text-3xl font-headline cursor-pointer">DesiBae</h1>
        </Link>
        <div className="flex items-center space-x-2 md:space-x-4">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-primary-foreground/50">
                    <AvatarImage src={userProfile?.avatarUrl || user.photoURL || undefined} alt={userProfile?.name || user.displayName || 'User'} />
                    <AvatarFallback>{getInitials(userProfile?.name || user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {userProfile?.name || user.displayName || 'DesiBae User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || (user.isAnonymous ? 'Anonymous User' : 'No email')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Add other items like "Profile", "Settings" later */}
                {/* <DropdownMenuItem>Profile</DropdownMenuItem> */}
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <UserCircle className="mr-2 h-5 w-5" /> Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={signInWithGoogle} className="cursor-pointer">
                  <LogIn className="mr-2 h-4 w-4" /> Sign in with Google
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signInAnonymously} className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" /> Continue Anonymously
                </DropdownMenuItem>
                {/* Phone Auth can be added later */}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
