
// src/components/layout/header.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut, UserCircle, Loader2, MessageSquareText, Settings, History, Sparkles, Users, Globe, Palette, Sun, Moon, Send, Gem, BookHeart, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; 
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { listenToOnlineUsersCount, listenToTotalRegisteredUsers } from '@/lib/firebase/rtdb';
import { useTheme } from 'next-themes';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, userProfile, loading, signInWithGoogle, signInAnonymously, signOut } = useAuth();
  const pathname = usePathname();
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [totalRegisteredCount, setTotalRegisteredCount] = useState(0);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      case 'light': return <Sun className="h-5 w-5" />;
      case 'dark': return <Moon className="h-5 w-5" />;
      case 'pink': return <Sparkles className="h-5 w-5 text-pink-500" />; 
      default: return <Palette className="h-5 w-5" />;
    }
  };

  const isPremiumUser = userProfile?.subscriptionTier === 'premium' || userProfile?.subscriptionTier === 'spicy';

  const navLinks = [
    { href: "/stories", label: "Stories", icon: BookHeart, activePath: "/stories"},
    { href: "https://t.me/desibaecommunity", label: "Join Group", icon: Send, target: "_blank"},
    ...(user ? [{ href: "/history", label: "History", icon: History, activePath: "/history"}] : []),
  ];

  const userMenuItems = [
    { href: "/", label: "Characters", icon: MessageSquareText },
    { href: "/stories", label: "Stories", icon: BookHeart },
    { href: "/history", label: "Chat History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const NavLinkItem: React.FC<{href: string; label: string; icon: React.ElementType; activePath?: string, target?: string; onClick?: () => void; className?: string}> = ({ href, label, icon: Icon, activePath, target, onClick, className }) => (
     <Link href={href} passHref target={target} onClick={onClick}>
        <Button 
            variant="ghost" 
            className={cn(
                "hover:bg-white/20 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-in-out group focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-primary transform hover:scale-105",
                (activePath && pathname.startsWith(activePath)) ? 'bg-white/30 text-white shadow-md' : 'text-white/80 hover:text-white',
                className
            )} 
            title={label}
        >
            <Icon className={cn("h-5 w-5 mr-1.5 group-hover:animate-pulse", (activePath && pathname.startsWith(activePath)) ? "text-white" : "")} /> {label}
        </Button>
    </Link>
  );


  return (
    <header className="bg-gradient-header text-primary-foreground p-3 shadow-lg sticky top-0 z-50 h-18 flex items-center">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" passHref>
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <Sparkles className="h-9 w-9 text-yellow-300 group-hover:animate-hue-rotate-glow transition-all duration-300 filter drop-shadow-[0_2.5px_3.5px_rgba(0,0,0,0.25)]" />
            <h1 className="text-3xl font-headline tracking-tight filter drop-shadow-[0_2.5px_2.5px_rgba(0,0,0,0.25)]">DesiBae</h1>
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-1.5">
          {navLinks.filter(link => link.label !== "History" || user).map(link => <NavLinkItem key={link.href} {...link} />)}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-white/20 rounded-full text-white/80 hover:text-white transform hover:scale-110 transition-transform" title="Change theme">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-2xl border-border/30 bg-card text-card-foreground">
              <DropdownMenuLabel className="text-muted-foreground px-2.5 py-1.5">Select Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light" className="cursor-pointer rounded-md focus:bg-primary/10 focus:text-primary py-2 px-2.5"><Sun className="mr-2 h-4 w-4" /> Light & Bright</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" className="cursor-pointer rounded-md focus:bg-primary/10 focus:text-primary py-2 px-2.5"><Moon className="mr-2 h-4 w-4" /> Neon Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pink" className="cursor-pointer rounded-md focus:bg-primary/10 focus:text-primary py-2 px-2.5"><Sparkles className="mr-2 h-4 w-4 text-pink-500" /> Vibrant Pink</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {loading ? (
            <Loader2 className="h-7 w-7 animate-spin text-white ml-2" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-primary ml-1 transform hover:scale-105 transition-transform">
                  <Avatar className="h-11 w-11 border-2 border-white/60 hover:border-yellow-300 transition-colors duration-200">
                    <AvatarImage src={userProfile?.avatarUrl || user.photoURL || undefined} alt={userProfile?.name || user.displayName || 'User'} />
                    <AvatarFallback className="bg-pink-200 text-pink-700 font-semibold text-lg">{getInitials(userProfile?.name || user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-xl shadow-2xl border-border/30 bg-card text-card-foreground" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-2.5">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none truncate text-foreground">
                        {userProfile?.name || user.displayName || 'Desi User'}
                      </p>
                      {isPremiumUser && (
                        <Badge variant="default" className="px-2 py-0.5 text-xs bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black shadow-sm border-yellow-600">
                          <Gem className="mr-1 h-3 w-3" />Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email || (user.isAnonymous ? 'Guest User' : 'No email')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userMenuItems.map(item => (
                  <DropdownMenuItem key={item.href} asChild className="cursor-pointer rounded-md focus:bg-primary/10 focus:text-primary py-2.5 px-2.5">
                    <Link href={item.href}><item.icon className="mr-2 h-4 w-4 text-muted-foreground" /> {item.label}</Link>
                  </DropdownMenuItem>
                ))}
                {!isPremiumUser && (
                  <DropdownMenuItem asChild className="cursor-pointer rounded-md focus:bg-yellow-400/20 focus:text-yellow-600 py-2.5 px-2.5 bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-orange-500/10">
                    <Link href="/subscribe?feature=PremiumAccessHeader">
                      <Gem className="mr-2 h-4 w-4 text-yellow-500" /> Upgrade to Premium
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive data-[highlighted]:!bg-destructive/10 data-[highlighted]:!text-destructive rounded-md py-2.5 px-2.5">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="bg-white/15 text-white hover:bg-white/30 rounded-lg shadow-md px-4 py-2.5 text-sm font-medium ml-2 transform hover:scale-105 transition-transform">
                  <UserCircle className="mr-1.5 h-5 w-5" /> Login / Sign Up
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-xl shadow-2xl border-border/30 bg-card text-card-foreground" align="end" forceMount>
                 <DropdownMenuLabel className="text-center text-muted-foreground text-sm py-2.5 px-2.5">Dil se connect karo! 😍</DropdownMenuLabel>
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signInWithGoogle} className="cursor-pointer group py-2.5 px-3 rounded-md focus:bg-primary/10 focus:text-primary">
                  <LogIn className="mr-2 h-4 w-4 text-muted-foreground" /> Sign in with Google
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signInAnonymously} className="cursor-pointer group py-2.5 px-3 rounded-md focus:bg-primary/10 focus:text-primary">
                  <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" /> Continue as Guest
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem asChild className="cursor-pointer rounded-md focus:bg-yellow-400/20 focus:text-yellow-600 py-2.5 px-2.5 bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-orange-500/10">
                    <Link href="/subscribe?feature=GuestUpgradePrompt">
                        <Gem className="mr-2 h-4 w-4 text-yellow-500" /> Explore Premium
                    </Link>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full transform hover:scale-110 transition-transform">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-card p-0 text-card-foreground shadow-2xl flex flex-col border-l-4 border-primary">
              <SheetHeader className="p-4 border-b border-border bg-gradient-to-br from-primary/20 to-secondary/10">
                <SheetTitle>
                    <Link href="/" passHref onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="flex items-center gap-2.5 cursor-pointer group">
                            <Sparkles className="h-7 w-7 text-primary group-hover:animate-pulse" />
                            <span className="text-2xl font-headline text-primary">DesiBae Menu</span>
                        </div>
                    </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col flex-grow p-4 overflow-y-auto space-y-2.5">
                <nav className="flex flex-col space-y-2 flex-grow">
                  {userMenuItems.map(item => (
                      <NavLinkItem 
                        key={item.href} 
                        href={item.href} 
                        label={item.label} 
                        icon={item.icon} 
                        activePath={item.activePath || item.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="!text-card-foreground hover:!bg-primary/10 data-[active=true]:!bg-primary/15 data-[active=true]:!text-primary w-full justify-start text-base py-3 !rounded-xl"
                      />
                  ))}
                   <NavLinkItem 
                        href="https://t.me/desibaecommunity" 
                        label="Join Telegram" 
                        icon={Send} 
                        target="_blank" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="!text-card-foreground hover:!bg-primary/10 w-full justify-start text-base py-3 !rounded-xl"
                    />
                  {!user && (
                     <>
                      <Button onClick={() => { signInWithGoogle(); setIsMobileMenuOpen(false); }} className="w-full justify-start text-base py-3.5 !rounded-xl bg-red-500 hover:bg-red-600 text-white mt-2.5"> <LogIn className="mr-2 h-5 w-5" /> Sign in with Google</Button>
                      <Button onClick={() => { signInAnonymously(); setIsMobileMenuOpen(false);}} variant="outline" className="w-full justify-start text-base py-3.5 !rounded-xl !border-primary/50 !text-primary hover:!bg-primary/10"> <UserCircle className="mr-2 h-5 w-5" /> Continue as Guest</Button>
                     </>
                  )}
                </nav>
                <div className="mt-auto space-y-2.5 pt-4 border-t border-border">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="outline" className="w-full justify-between !rounded-xl text-muted-foreground border-border py-3">
                          <span>Change Theme</span> {getThemeIcon()}
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full rounded-xl shadow-xl border-border/30 bg-card text-card-foreground">
                      <DropdownMenuRadioGroup value={theme} onValueChange={(v) => { setTheme(v); }}>
                        <DropdownMenuRadioItem value="light" className="cursor-pointer rounded-md focus:bg-primary/10 focus:text-primary py-2 px-2.5"><Sun className="mr-2 h-4 w-4" /> Light & Bright</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark" className="cursor-pointer rounded-md focus:bg-primary/10 focus:text-primary py-2 px-2.5"><Moon className="mr-2 h-4 w-4" /> Neon Dark</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="pink" className="cursor-pointer rounded-md focus:bg-primary/10 focus:text-primary py-2 px-2.5"><Sparkles className="mr-2 h-4 w-4 text-pink-500" /> Vibrant Pink</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                   {user && (
                      <Button variant="outline" onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full !rounded-xl text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive py-3">
                         <LogOut className="mr-2 h-4 w-4"/> Sign Out
                      </Button>
                   )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
