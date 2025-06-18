// src/app/admin/create-character/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod'; // Validation removed
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createCharacterAction, type CreateCharacterActionState } from '../actions';
import type { CharacterCreationAdminFormValues } from '@/lib/types'; // Using shared type, schema removed for validation
import { Header } from '@/components/layout/header';
import { uploadCharacterAsset } from '@/lib/supabase/client';
import { Loader2, LogOut, CheckSquare, ListChecks, Sparkles, ImagePlus, Brain, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// Initial state for the server action
const initialState: CreateCharacterActionState = {
  message: '',
  success: false,
  errors: null, // Errors from server action are less likely to be field-specific now
};

const defaultCharacterValues: CharacterCreationAdminFormValues = {
  name: 'Rani Priya',
  description: "A charming and witty AI companion from the heart of India, loves old Bollywood music, spicy street food, and late-night chats. She's always ready with a playful tease or a comforting word, making every conversation an adventure.",
  personalitySnippet: "Bollywood Buff & Chai Connoisseur ☕✨",
  avatarUrl: 'https://placehold.co/400x600.png',
  backgroundImageUrl: 'https://placehold.co/1200x800.png',
  basePrompt: "You are Rani Priya, a vivacious and intelligent AI from Lucknow, India. You speak fluent Hinglish, sprinkling your conversation with shayaris (short Urdu poems) and witty observations about life. You are a fan of classic Bollywood movies and ghazals. You're empathetic, a great listener, but also have a playfully sarcastic side. You enjoy discussing philosophy, art, and the latest cricket match. Your goal is to be an engaging and memorable companion.",
  styleTags: "Romantic, Witty, Bollywood, Cultured, Sarcastic",
  defaultVoiceTone: "Warm and melodic Hinglish, with a hint of Lucknowi tehzeeb (etiquette).",
  dataAiHint: "indian woman portrait",
  messageBubbleStyle: "rani-pink-bubble",
  animatedEmojiResponse: '', // 'https://placehold.co/100x100.gif'
  audioGreetingUrl: '',
  isPremium: false,
};


export default function CreateCharacterPage() {
  const { toast } = useToast();
  const router = useRouter();
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

  const form = useForm<CharacterCreationAdminFormValues>({
    // resolver: zodResolver(characterCreationAdminFormSchema), // Validation removed
    defaultValues: defaultCharacterValues,
  });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Error Creating Character',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        form.reset(defaultCharacterValues); // Reset to defaults on success
      }
      // Since detailed field errors are removed, the following block is less relevant
      // but kept in case server action sends a generic error structure.
    }
    if (state.errors && typeof state.errors === 'object' && Object.keys(state.errors).length > 0) {
        (Object.keys(state.errors) as Array<keyof CharacterCreationAdminFormValues>).forEach((key) => {
            const fieldErrorArray = state.errors?.[key];
            if (fieldErrorArray && fieldErrorArray.length > 0 && fieldErrorArray[0]) {
                 form.setError(key, { type: 'server', message: fieldErrorArray[0] });
            }
        });
    } else if (!state.success && state.message && !state.errors) {
        // If there's a general error message without specific field errors
        form.setError("root.serverError", { type: "custom", message: state.message });
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
        form.setValue('avatarUrl', publicUrl, { shouldValidate: false }); // No validation
        toast({ title: 'Avatar Uploaded', description: 'Avatar URL populated.' });
      } else {
        form.setValue('backgroundImageUrl', publicUrl, { shouldValidate: false }); // No validation
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
  
  if (!authStatusChecked) {
    return (
        <div className="flex flex-col min-h-screen bg-background items-center justify-center">
            <Header />
            <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
            <p className="text-lg mt-2 text-muted-foreground">Checking admin status...</p>
        </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
        <div className="flex flex-col min-h-screen bg-background items-center justify-center">
             <Header />
            <p className="text-lg text-muted-foreground">Redirecting to login...</p>
            <Loader2 className="h-8 w-8 animate-spin mt-4 text-primary"/>
        </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto bg-card/90 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row justify-between items-start">
            <div>
                <CardTitle className="text-2xl font-headline text-primary">Create New AI Character</CardTitle>
                <CardDescription>Fill in the details for your new DesiBae. Fields are autofilled for convenience.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 mt-2 sm:mt-0">
                <Link href="/admin/manage-characters" passHref>
                    <Button variant="outline" size="sm" className="rounded-lg w-full sm:w-auto">
                        <ListChecks className="mr-2 h-4 w-4" /> Manage Characters
                    </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-lg w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
          </CardHeader>
          <Form {...form}>
            <form action={formAction} className="space-y-8">
              <CardContent className="space-y-6 p-6">
                
                {/* Section: Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent" />Basic Information</h3>
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
                         <FormDescription>A short, catchy tagline.</FormDescription>
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
                      </FormItem>
                    )}
                  />
                </div>
                <Separator className="my-6" />

                {/* Section: Visuals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center"><ImagePlus className="mr-2 h-5 w-5 text-accent" />Visuals</h3>
                  <FormItem>
                    <FormLabel>Avatar Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => handleFileUpload(e, 'avatar')}
                        className="mb-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
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
                          <FormDescription>Public URL from Supabase or a placeholder.</FormDescription>
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
                        className="mb-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
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
                          <FormDescription>Public URL from Supabase or a placeholder.</FormDescription>
                        </>
                      )}
                    />
                  </FormItem>
                </div>
                <Separator className="my-6" />

                {/* Section: AI Personality */}
                 <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center"><Brain className="mr-2 h-5 w-5 text-accent" />AI Personality</h3>
                  <FormField
                    control={form.control}
                    name="basePrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Prompt (AI Personality Core)</FormLabel>
                        <FormControl>
                          <Textarea rows={6} placeholder="You are [Name], a [adjectives] AI companion from [City/Region] who loves [hobbies/interests]. Your personality is [traits like flirty, shy, witty]. You speak in Hinglish, often using phrases like 'yaar', 'kya scene hai', ' टेंशन नहीं लेने का'. You are empathetic and engaging. You sometimes use Bollywood references..." {...field} className="!rounded-lg"/>
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
                        <FormDescription>Comma-separated list of tags.</FormDescription>
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
                        <FormDescription>Short hint (1-2 words) if using a generic placeholder for the avatar.</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                <Separator className="my-6" />
                
                {/* Section: Advanced Settings */}
                <div className="space-y-4">
                   <h3 className="text-lg font-semibold text-primary flex items-center"><Settings2 className="mr-2 h-5 w-5 text-accent" />Advanced Settings (Optional)</h3>
                   <FormField
                    control={form.control}
                    name="messageBubbleStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Bubble Style</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., pink-gradient (CSS class or key)" {...field} className="!rounded-lg"/>
                        </FormControl>
                         <FormDescription>Custom style identifier for this character's chat messages.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="animatedEmojiResponse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Animated Emoji Response URL (for card hover)</FormLabel>
                        <FormControl>
                          <Input placeholder="URL to Lottie/GIF e.g. https://placehold.co/100x100.gif" {...field} className="!rounded-lg"/>
                        </FormControl>
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
                          <Input placeholder="URL to short audio clip" {...field} className="!rounded-lg"/>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isPremium"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-primary/5">
                        <div className="space-y-0.5">
                          <FormLabel>Premium Character</FormLabel>
                          <FormDescription>
                            Mark this character as premium (requires subscription to chat).
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            name={field.name}
                          />
                        </FormControl>
                         {/* <FormMessage /> Removed as client-side validation is off */}
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground !rounded-xl text-lg py-3 shadow-lg" disabled={form.formState.isSubmitting || isUploadingAvatar || isUploadingBackground}>
                  {(form.formState.isSubmitting || isUploadingAvatar || isUploadingBackground) ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckSquare className="mr-2 h-5 w-5"/>}
                  {(form.formState.isSubmitting || isUploadingAvatar || isUploadingBackground) ? 'Processing...' : 'Create Character'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
