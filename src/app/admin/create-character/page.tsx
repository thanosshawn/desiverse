// src/app/admin/create-character/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createCharacterAction, type CreateCharacterActionState } from '../actions';
import type { CharacterCreationAdminFormValues } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { uploadCharacterAsset } from '@/lib/supabase/client';
import { Loader2, LogOut, CheckSquare, ListChecks, Sparkles, ImagePlus, Brain, Settings2, Info, RefreshCw, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { generateRandomCharacterDefaults } from '@/lib/admin/utils';

const initialState: CreateCharacterActionState = {
  message: '',
  success: false,
  errors: null,
};

export default function CreateCharacterPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm<CharacterCreationAdminFormValues>({
    defaultValues: generateRandomCharacterDefaults(),
  });
  
  const [state, formAction] = useActionState(createCharacterAction, initialState);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [authStatusChecked, setAuthStatusChecked] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    setIsAdminLoggedIn(loggedIn);
    setAuthStatusChecked(true);

    if (!loggedIn && authStatusChecked) {
      router.replace('/admin/login');
      toast({ title: 'Unauthorized', description: 'Please login as admin.', variant: 'destructive' });
    }
  }, [router, toast, authStatusChecked]);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Error Creating Character',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        form.reset(generateRandomCharacterDefaults()); 
      }
    }
  }, [state, toast, form]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: 'avatar' | 'background'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fileType === 'avatar') setIsUploadingAvatar(true);
    if (fileType === 'background') setIsUploadingBackground(true);

    try {
      const pathPrefix = fileType === 'avatar' ? 'avatars' : 'backgrounds';
      const publicUrl = await uploadCharacterAsset(file, pathPrefix);

      if (fileType === 'avatar') {
        form.setValue('avatarUrl', publicUrl, { shouldValidate: false });
        toast({ title: 'Avatar Uploaded', description: 'Avatar URL populated.' });
      } else {
        form.setValue('backgroundImageUrl', publicUrl, { shouldValidate: false });
        toast({ title: 'Background Image Uploaded', description: 'Background URL populated.' });
      }
    } catch (error: any) {
      console.error(`Error uploading ${fileType}:`, error);
      const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : 'Failed to upload file.');
      toast({
        title: `Upload Error (${fileType})`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      if (fileType === 'avatar') setIsUploadingAvatar(false);
      if (fileType === 'background') setIsUploadingBackground(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    toast({ title: 'Logged Out', description: 'You have been logged out as admin.' });
    router.replace('/admin/login');
  };

  const handleRegenerateDefaults = () => {
    form.reset(generateRandomCharacterDefaults());
    toast({ title: 'New Character Data Loaded', description: 'The form has been autofilled with new random values.' });
  };

  if (!authStatusChecked) {
    return (
        <div className="flex flex-col min-h-screen bg-background items-center justify-center">
            <Header />
            <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
              <p className="text-lg mt-2 text-muted-foreground">Checking admin status...</p>
            </main>
        </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
        <div className="flex flex-col min-h-screen bg-background items-center justify-center">
             <Header />
            <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center">
              <p className="text-lg text-muted-foreground">Redirecting to login...</p>
              <Loader2 className="h-8 w-8 animate-spin mt-4 text-primary"/>
            </main>
        </div>
    );
  }

  const isSubmitting = form.formState.isSubmitting || isUploadingAvatar || isUploadingBackground;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8">
        <Card className="max-w-3xl mx-auto bg-card/90 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6">
            <div className="flex-grow">
                <CardTitle className="text-2xl font-headline text-primary">Create New AI Character</CardTitle>
                <CardDescription>Autofilled with random data. Click <RefreshCw className="inline h-4 w-4 text-accent align-middle cursor-pointer" onClick={handleRegenerateDefaults} title="Regenerate autofill data"/> to regenerate.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={handleRegenerateDefaults} className="!rounded-lg w-full sm:w-auto" title="Regenerate autofill data">
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                </Button>
                <Link href="/admin/manage-characters" passHref className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Manage existing characters">
                        <ListChecks className="mr-2 h-4 w-4" /> Manage
                    </Button>
                </Link>
                 <Link href="/admin/analytics" passHref className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="!rounded-lg w-full" title="View Analytics">
                        <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                    </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="!rounded-lg w-full sm:w-auto" title="Logout from admin">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
          </CardHeader>
          <Form {...form}>
            <form action={formAction} className="space-y-8">
              <CardContent className="space-y-6 p-6 pt-0">

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center"><Info className="mr-2 h-5 w-5 text-accent" />Basic Information</h3>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Character Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Simran Kaur" {...field} className="!rounded-lg" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalitySnippet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personality Snippet (for character card)</FormLabel>
                        <FormControl>
                          <Input placeholder="Poetic & Shy Chai Lover ☕" {...field} className="!rounded-lg" />
                        </FormControl>
                         <FormDescription>A short, catchy tagline displayed on the character selection card.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Description (for AI context, can be longer)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A shy, poetic girl from Delhi who loves chai, long walks, and Bollywood movies from the 90s..." {...field} className="!rounded-lg" rows={3} />
                        </FormControl>
                         <FormDescription>Detailed background for the AI's personality and for display (if needed).</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center"><ImagePlus className="mr-2 h-5 w-5 text-accent" />Visuals</h3>
                  <FormItem>
                    <FormLabel>Avatar Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => handleFileUpload(e, 'avatar')}
                        className="mb-2 file:mr-4 file:py-2 file:px-4 file:!rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 !rounded-lg"
                        disabled={isUploadingAvatar}
                      />
                    </FormControl>
                    {isUploadingAvatar && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading avatar...</div>}
                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <>
                          <FormControl>
                            <Input placeholder="Supabase Avatar URL (auto-filled on upload or use default)" {...field} disabled={isUploadingAvatar} className="!rounded-lg" />
                          </FormControl>
                          <FormDescription>Public URL from Supabase or a placeholder (e.g., https://placehold.co/400x600.png).</FormDescription>
                        </>
                      )}
                    />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Background Image (Optional for Chat)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => handleFileUpload(e, 'background')}
                        className="mb-2 file:mr-4 file:py-2 file:px-4 file:!rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 !rounded-lg"
                        disabled={isUploadingBackground}
                      />
                    </FormControl>
                    {isUploadingBackground && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading background...</div>}
                    <FormField
                      control={form.control}
                      name="backgroundImageUrl"
                      render={({ field }) => (
                        <>
                          <FormControl>
                            <Input placeholder="Supabase Background URL (auto-filled or default)" {...field} disabled={isUploadingBackground} className="!rounded-lg"/>
                          </FormControl>
                          <FormDescription>Public URL from Supabase or a placeholder (e.g., https://placehold.co/1200x800.png).</FormDescription>
                        </>
                      )}
                    />
                  </FormItem>
                </div>
                <Separator className="my-6" />

                 <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center"><Brain className="mr-2 h-5 w-5 text-accent" />AI Personality</h3>
                  <FormField
                    control={form.control}
                    name="basePrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Prompt (AI Personality Core)</FormLabel>
                        <FormControl>
                          <Textarea rows={6} placeholder="You are [Name], a [adjectives] AI companion from [City/Region] who loves [hobbies/interests]. Your personality is [traits like flirty, shy, witty]. You speak in Hinglish, often using phrases like 'yaar', 'kya scene hai', 'टेंशन नहीं लेने का'. You are empathetic and engaging. You sometimes use Bollywood references..." {...field} className="!rounded-lg"/>
                        </FormControl>
                        <FormDescription>The core personality instructions for the AI. Be descriptive!</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="styleTags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style Tags (for filtering & AI context)</FormLabel>
                        <FormControl>
                          <Input placeholder="Romantic, Shy, Bollywood, Funny, Bold" {...field} className="!rounded-lg"/>
                        </FormControl>
                        <FormDescription>Comma-separated list of tags for discoverability and AI prompt refinement.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultVoiceTone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Voice Tone (for future TTS)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Sweet and playful Hinglish" {...field} className="!rounded-lg"/>
                        </FormControl>
                         <FormDescription>Describes the character's voice style for text-to-speech generation.</FormDescription>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="dataAiHint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image AI Hint (for avatar placeholders)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., indian woman smile" {...field} className="!rounded-lg"/>
                        </FormControl>
                        <FormDescription>Short hint (1-2 words) if using a generic placeholder image for the avatar.</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                <Separator className="my-6" />

                <div className="space-y-4">
                   <h3 className="text-lg font-semibold text-primary flex items-center"><Settings2 className="mr-2 h-5 w-5 text-accent" />Advanced Settings (Optional)</h3>
                   <FormField
                    control={form.control}
                    name="messageBubbleStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Bubble Style</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., rani-pink-bubble (CSS class or key)" {...field} className="!rounded-lg"/>
                        </FormControl>
                         <FormDescription>Custom style identifier for this character's chat messages (e.g., a CSS class).</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="animatedEmojiResponse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Animated Emoji/Sticker URL (for card hover)</FormLabel>
                        <FormControl>
                          <Input placeholder="URL to Lottie/GIF e.g. https://placehold.co/100x100.gif" {...field} className="!rounded-lg"/>
                        </FormControl>
                        <FormDescription>Link to a small animation displayed on character card interactions.</FormDescription>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="audioGreetingUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audio Greeting URL (for card hover)</FormLabel>
                        <FormControl>
                          <Input placeholder="URL to short audio clip (e.g., .mp3)" {...field} className="!rounded-lg"/>
                        </FormControl>
                         <FormDescription>Link to a brief audio greeting for character card interactions.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isPremium"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border p-3 shadow-sm space-y-1.5">
                        <div className="flex flex-row items-center justify-between">
                          <FormLabel htmlFor={`${field.name}-premium-switch`} className="text-sm font-medium">
                            Premium Character
                          </FormLabel>
                          <FormControl>
                            <Switch
                              id={`${field.name}-premium-switch`}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-describedby={`${field.name}-premium-description`}
                            />
                          </FormControl>
                        </div>
                        <FormDescription id={`${field.name}-premium-description`} className="text-xs text-muted-foreground">
                          Mark this character as premium (requires subscription to chat).
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground !rounded-xl text-lg py-3 shadow-lg" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckSquare className="mr-2 h-5 w-5"/>}
                  {isSubmitting ? 'Processing...' : 'Create Character'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
