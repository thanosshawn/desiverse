
// src/app/settings/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firebase/rtdb';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Palette, Languages, ShieldCheck, Sun, Moon, Sparkles, User, LogOut, Camera, Gem, Settings as SettingsIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from 'next-themes';
import { getInitials } from '@/lib/utils'; 
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';


const settingsFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be 50 characters or less.').optional(),
  avatarUrl: z.string().url('Please enter a valid URL for your avatar.').optional().or(z.literal('')),
  selectedTheme: z.enum(['light', 'dark', 'pink']).optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme } = useTheme(); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      selectedTheme: 'light',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        name: userProfile.name || '',
        avatarUrl: userProfile.avatarUrl || '',
        selectedTheme: userProfile.selectedTheme || theme || 'light',
      });
    } else if (theme && mounted) { 
        form.setValue('selectedTheme', theme as 'light' | 'dark' | 'pink');
    }
  }, [userProfile, form, theme, mounted]); 
  

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) {
      toast({ title: 'Not Logged In', description: 'You must be logged in to save settings.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const updateData: Partial<UserProfile> = {};
      if (data.name !== undefined && data.name !== (userProfile?.name || '')) updateData.name = data.name;
      if (data.avatarUrl !== (userProfile?.avatarUrl || '')) updateData.avatarUrl = data.avatarUrl || null;
      
      if (data.selectedTheme && data.selectedTheme !== (userProfile?.selectedTheme || theme)) {
        updateData.selectedTheme = data.selectedTheme;
        setTheme(data.selectedTheme); 
      }

      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(user.uid, updateData);
        toast({ title: 'Settings Saved! ✨', description: 'Aapki profile update ho gayi hai! 🎉' });
      } else {
        toast({ title: 'No Changes', description: 'Aapne kuch badla nahi.' });
      }
    } catch (error: any) {
      toast({ title: 'Save Error', description: error.message || 'Could not save settings.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (authLoading || !mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
           <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg font-body text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-8 text-center">
            <User className="mx-auto h-20 w-20 text-primary/20 mb-6 animate-pulse" />
            <h2 className="text-2xl font-headline text-primary mb-4">Login Required</h2>
            <p className="text-muted-foreground font-body">Please login to access settings.</p>
            <Link href="/login?redirect=/settings" className="mt-6">
                <Button variant="default" className="mt-4 !rounded-xl bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground shadow-lg hover:shadow-primary/30 py-3 px-6">Login Now</Button>
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-24 pb-12">
        <Card className="max-w-2xl mx-auto bg-card/90 backdrop-blur-xl shadow-2xl rounded-3xl border-2 border-primary/10 animate-fade-in">
          <CardHeader className="text-center p-6 md:p-8 border-b border-border/20">
            <SettingsIcon className="mx-auto h-12 w-12 text-primary mb-3 animate-pulse-spinner" />
            <CardTitle className="text-3xl md:text-4xl font-headline text-primary">Settings</CardTitle>
            <CardDescription className="font-body text-muted-foreground text-base">Apni profile aur app preferences yahaan manage karo.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <CardContent className="space-y-8 p-6 md:p-8">
                
                <div className="space-y-6">
                  <h3 className="text-xl font-headline text-primary/90 flex items-center"><User className="mr-2.5 h-6 w-6 text-accent"/> Profile Details</h3>
                  <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-28 w-28 border-4 border-primary/50 shadow-lg rounded-2xl">
                          <AvatarImage src={form.watch('avatarUrl') || userProfile?.avatarUrl || user.photoURL || undefined} alt={form.watch('name') || userProfile?.name || user.displayName || 'User'} />
                          <AvatarFallback className="text-4xl bg-pink-100 text-pink-600 rounded-xl">{getInitials(form.watch('name') || userProfile?.name || user.displayName)}</AvatarFallback>
                      </Avatar>
                      <Button type="button" variant="outline" size="sm" className="!rounded-lg text-xs border-primary/40 text-primary hover:bg-primary/10 py-2 px-3">
                        <Camera className="mr-2 h-4 w-4"/> Change Avatar (URL below)
                      </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your awesome name" {...field} className="!rounded-xl text-sm md:text-base p-3.5 border-border/50 focus:border-primary focus:ring-primary" />
                        </FormControl>
                        <FormDescription className="text-xs">This is how your Baes will see you.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Avatar URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/your-avatar.png" {...field} className="!rounded-xl text-sm md:text-base p-3.5 border-border/50 focus:border-primary focus:ring-primary" />
                        </FormControl>
                         <FormDescription className="text-xs">Link to your public avatar image (e.g., from Imgur, Google Photos).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Separator className="my-6 bg-border/30"/>

                <div className="space-y-6">
                    <h3 className="text-xl font-headline text-primary/90 flex items-center"><Palette className="mr-2.5 h-6 w-6 text-accent"/> Appearance</h3>
                    <FormField
                      control={form.control}
                      name="selectedTheme"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">Theme</FormLabel>
                             <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                }} 
                                value={field.value} 
                                disabled={!mounted}
                             >
                                <FormControl>
                                  <SelectTrigger className="w-full !rounded-xl text-sm md:text-base p-3.5 border-border/50 focus:border-primary focus:ring-primary">
                                      <SelectValue placeholder="Select app theme" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                                    <SelectItem value="light" className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-md py-2 px-2.5"><Sun className="inline-block mr-2 h-4 w-4"/> Light & Bright</SelectItem>
                                    <SelectItem value="dark" className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-md py-2 px-2.5"><Moon className="inline-block mr-2 h-4 w-4"/> Neon Dark</SelectItem>
                                    <SelectItem value="pink" className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-md py-2 px-2.5"><Sparkles className="inline-block mr-2 h-4 w-4 text-pink-500"/> Vibrant Pink</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">Choose how your app looks and feels.</FormDescription>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <Separator className="my-6 bg-border/30"/>
                
                <div className="space-y-6">
                    <h3 className="text-xl font-headline text-primary/90 flex items-center"><Languages className="mr-2.5 h-6 w-6 text-accent"/> Language</h3>
                     <FormItem>
                        <FormLabel className="text-base font-medium">App Language (Coming Soon)</FormLabel>
                         <Select defaultValue={userProfile?.languagePreference || 'hinglish'} disabled>
                            <SelectTrigger className="w-full !rounded-xl text-sm md:text-base p-3.5 border-border/50 opacity-70 cursor-not-allowed">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                                <SelectItem value="hinglish" className="py-2 px-2.5">Hinglish (Recommended)</SelectItem>
                                <SelectItem value="english" className="py-2 px-2.5">English</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">Baat karne ka style. More options soon!</FormDescription>
                    </FormItem>
                </div>
                <Separator className="my-6 bg-border/30"/>
                
                 <div className="space-y-6">
                    <h3 className="text-xl font-headline text-primary/90 flex items-center"><Gem className="mr-2.5 h-6 w-6 text-yellow-400"/> Subscription</h3>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl shadow-sm">
                        <p className="text-base font-medium text-card-foreground">Current Plan: <span className="capitalize font-semibold text-primary">{userProfile?.subscriptionTier || 'Free'}</span></p>
                        {userProfile?.subscriptionTier === 'free' && (
                             <Link href="/subscribe?feature=SettingsUpgrade" className="mt-3 block">
                                <Button size="sm" className="w-full !rounded-lg bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black shadow-md hover:shadow-lg py-2.5">
                                    Upgrade to Premium
                                </Button>
                            </Link>
                        )}
                         {userProfile?.subscriptionTier !== 'free' && (
                             <p className="text-xs text-muted-foreground mt-1">You have access to all premium features!</p>
                        )}
                    </div>
                </div>
                <Separator className="my-6 bg-border/30"/>


                <div className="space-y-4">
                    <h3 className="text-xl font-headline text-destructive/90 flex items-center"><ShieldCheck className="mr-2.5 h-6 w-6 text-destructive/70"/> Account Actions</h3>
                    <Button type="button" variant="outline" onClick={signOut} className="w-full !rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/70 border-destructive/50 text-destructive text-base py-3.5">
                        <LogOut className="mr-2 h-5 w-5"/> Sign Out
                    </Button>
                     <Button type="button" variant="destructive" className="w-full !rounded-xl opacity-60 cursor-not-allowed text-base py-3.5" disabled>
                        Delete Account (Coming Soon)
                    </Button>
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-8 border-t border-border/20">
                <Button type="submit" className="w-full bg-gradient-to-r from-primary via-rose-500 to-pink-600 text-primary-foreground !rounded-xl text-lg py-3.5 shadow-lg hover:shadow-primary/40 transition-all duration-200 ease-in-out transform hover:scale-[1.02]" disabled={isSaving || !mounted}>
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
