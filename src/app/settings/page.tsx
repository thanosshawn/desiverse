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
import { Loader2, Save, Palette, Languages, Bell, ShieldCheck, Sun, Moon, Sparkles } from 'lucide-react';
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
import { getInitials } from '@/lib/utils'; // Import getInitials


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
  const { theme, setTheme, themes: availableThemes } = useTheme();
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
      if(userProfile.selectedTheme && userProfile.selectedTheme !== theme){
        setTheme(userProfile.selectedTheme);
      }
    } else if (theme) {
        form.setValue('selectedTheme', theme as 'light' | 'dark' | 'pink');
    }
  }, [userProfile, form, theme, setTheme]);
  

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to save settings.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const updateData: Partial<UserProfile> = {};
      if (data.name && data.name !== userProfile?.name) updateData.name = data.name;
      if (data.avatarUrl !== (userProfile?.avatarUrl || '')) updateData.avatarUrl = data.avatarUrl || null;
      if (data.selectedTheme && data.selectedTheme !== userProfile?.selectedTheme) {
        updateData.selectedTheme = data.selectedTheme;
        setTheme(data.selectedTheme); 
      }


      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(user.uid, updateData);
        toast({ title: 'Settings Saved!', description: 'Aapki profile update ho gayi hai! 🎉' });
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
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow container mx-auto px-4 py-8 text-center">
            <h2 className="text-2xl font-headline text-primary mb-4">Access Denied</h2>
            <p className="text-muted-foreground">Please login to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8">
        <Card className="max-w-2xl mx-auto bg-card/90 backdrop-blur-lg shadow-2xl rounded-2xl">
          <CardHeader className="text-center p-6">
            <CardTitle className="text-3xl font-headline text-primary">Settings</CardTitle>
            <CardDescription className="font-body">Apni profile aur app preferences yahaan manage karo.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-24 w-24 border-4 border-primary/50 shadow-md">
                        <AvatarImage src={form.watch('avatarUrl') || userProfile?.avatarUrl || user.photoURL || undefined} alt={form.watch('name') || userProfile?.name || user.displayName || 'User'} />
                        <AvatarFallback className="text-3xl bg-pink-100 text-pink-600">{getInitials(form.watch('name') || userProfile?.name || user.displayName)}</AvatarFallback>
                    </Avatar>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your awesome name" {...field} className="!rounded-lg text-sm md:text-base p-3" />
                      </FormControl>
                      <FormDescription>This is how your Baes will see you.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Avatar URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/your-avatar.png" {...field} className="!rounded-lg text-sm md:text-base p-3" />
                      </FormControl>
                       <FormDescription>Link to your public avatar image.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="text-lg font-headline text-primary/90 flex items-center"><Palette className="mr-2 h-5 w-5"/> Appearance</h3>
                    <FormField
                      control={form.control}
                      name="selectedTheme"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base">Theme</FormLabel>
                             <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setTheme(value); 
                                }} 
                                value={field.value}
                                disabled={!mounted}
                             >
                                <FormControl>
                                  <SelectTrigger className="w-full !rounded-lg text-sm md:text-base p-3">
                                      <SelectValue placeholder="Select app theme" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="light"><Sun className="inline-block mr-2 h-4 w-4"/> Light</SelectItem>
                                    <SelectItem value="dark"><Moon className="inline-block mr-2 h-4 w-4"/> Dark Soul</SelectItem>
                                    <SelectItem value="pink"><Sparkles className="inline-block mr-2 h-4 w-4 text-pink-500"/> Gulabi Mode</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>Choose how your app looks.</FormDescription>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="text-lg font-headline text-primary/90 flex items-center"><Languages className="mr-2 h-5 w-5"/> Language</h3>
                     <FormItem>
                        <FormLabel className="text-base">App Language (Coming Soon)</FormLabel>
                         <Select defaultValue={userProfile?.languagePreference || 'hinglish'} disabled>
                            <SelectTrigger className="w-full !rounded-lg text-sm md:text-base p-3">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="hinglish">Hinglish (Recommended)</SelectItem>
                                <SelectItem value="english">English</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>Baat karne ka style. More options soon!</FormDescription>
                    </FormItem>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="text-lg font-headline text-primary/90 flex items-center"><Bell className="mr-2 h-5 w-5"/> Notifications (Coming Soon)</h3>
                     <div className="flex items-center space-x-2 p-3 border border-input rounded-lg bg-muted/50">
                        <Switch id="notifications-switch" disabled className="opacity-50"/>
                        <Label htmlFor="notifications-switch" className="text-muted-foreground">Receive push notifications</Label>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                    <h3 className="text-lg font-headline text-primary/90 flex items-center"><ShieldCheck className="mr-2 h-5 w-5"/> Account Actions</h3>
                    <Button type="button" variant="outline" onClick={signOut} className="w-full !rounded-xl">
                        Sign Out
                    </Button>
                     <Button type="button" variant="destructive" className="w-full !rounded-xl opacity-50 cursor-not-allowed" disabled>
                        Delete Account (Coming Soon)
                    </Button>
                </div>


              </CardContent>
              <CardFooter className="p-6">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground !rounded-xl text-lg py-3 shadow-lg hover:shadow-primary/40" disabled={isSaving || !mounted}>
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
