// src/app/admin/create-character/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createCharacterAction, type CreateCharacterActionState } from '../actions';
import { characterCreationAdminFormSchema, type CharacterCreationAdminFormValues } from '@/lib/types'; // Using shared schema and type
import { Header } from '@/components/layout/header';
import { uploadCharacterAsset } from '@/lib/supabase/client';
import { Loader2, LogOut, CheckSquare, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

// Initial state for the server action
const initialState: CreateCharacterActionState = {
  message: '',
  success: false,
  errors: null,
};

export default function CreateCharacterPage() {
  const { toast } = useToast();
  const router = useRouter();
  // useActionState for handling form submission with server action
  const [state, formAction] = useActionState(createCharacterAction, initialState);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [authStatusChecked, setAuthStatusChecked] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    setIsAdminLoggedIn(loggedIn);
    setAuthStatusChecked(true);

    if (!loggedIn && authStatusChecked) { // Ensure authStatusChecked is true before redirecting
      router.replace('/admin/login');
      toast({ title: 'Unauthorized', description: 'Please login as admin.', variant: 'destructive' });
    }
  }, [router, toast, authStatusChecked]); // Added authStatusChecked dependency

  // Initialize react-hook-form with Zod validation
  const form = useForm<CharacterCreationAdminFormValues>({
    resolver: zodResolver(characterCreationAdminFormSchema), // Using shared schema
    defaultValues: {
      name: '',
      description: '',
      personalitySnippet: '',
      avatarUrl: '',
      backgroundImageUrl: '',
      basePrompt: '',
      styleTags: '',
      defaultVoiceTone: '',
      dataAiHint: '',
      messageBubbleStyle: '',
      animatedEmojiResponse: '',
      audioGreetingUrl: '',
      isPremium: false,
    },
  });

  // Effect to handle server action response (state updates)
  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Error',
        description: state.message, // This message comes from the server action
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        form.reset(); // Reset form on successful character creation
      }
    }
    // Set form errors if returned by the server action
    if (state.errors) {
        (Object.keys(state.errors) as Array<keyof CharacterCreationAdminFormValues>).forEach((key) => {
            const fieldErrorArray = state.errors?.[key];
            if (fieldErrorArray && fieldErrorArray.length > 0 && fieldErrorArray[0]) {
                 form.setError(key, { type: 'server', message: fieldErrorArray[0] });
            }
        });
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
        form.setValue('avatarUrl', publicUrl, { shouldValidate: true });
        toast({ title: 'Avatar Uploaded', description: 'Avatar URL populated.' });
      } else {
        form.setValue('backgroundImageUrl', publicUrl, { shouldValidate: true });
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
        <Card className="max-w-2xl mx-auto bg-card/90 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle className="text-2xl font-headline text-primary">Create New AI Character</CardTitle>
                <CardDescription>Fill in the details for your new DesiBae character.</CardDescription>
            </div>
            <div className="space-x-2">
                <Link href="/admin/manage-characters" passHref>
                    <Button variant="outline" size="sm" className="rounded-lg">
                        <ListChecks className="mr-2 h-4 w-4" /> Manage Characters
                    </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-lg">
                <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
          </CardHeader>
          <Form {...form}>
            <form action={formAction} className="space-y-6">
              <CardContent className="space-y-4 p-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Character Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Simran Kaur" {...field} className="!rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A shy, poetic girl from Delhi who loves chai, long walks, and Bollywood movies from the 90s..." {...field} className="!rounded-lg" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="personalitySnippet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personality Snippet (for card)</FormLabel>
                      <FormControl>
                        <Input placeholder="Poetic & Shy Chai Lover ☕" {...field} className="!rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                          <Input placeholder="Supabase Avatar URL (auto-filled on upload)" {...field} disabled={isUploadingAvatar} className="!rounded-lg" />
                        </FormControl>
                        <FormDescription>Public URL from Supabase. (e.g., https://project-ref.supabase.co/.../avatar.png)</FormDescription>
                        <FormMessage />
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
                          <Input placeholder="Supabase Background URL (auto-filled on upload)" {...field} disabled={isUploadingBackground} className="!rounded-lg"/>
                        </FormControl>
                        <FormDescription>Public URL from Supabase. (e.g., https://project-ref.supabase.co/.../background.jpg)</FormDescription>
                        <FormMessage />
                      </>
                    )}
                  />
                </FormItem>

                <FormField
                  control={form.control}
                  name="basePrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Prompt (AI Personality Core)</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="You are [Name], a [adjectives] AI companion from [City/Region] who loves [hobbies/interests]. Your personality is [traits like flirty, shy, witty]. You speak in Hinglish, often using phrases like 'yaar', 'kya scene hai', ' टेंशन नहीं लेने का'. You are empathetic and engaging. You sometimes use Bollywood references..." {...field} className="!rounded-lg"/>
                      </FormControl>
                      <FormDescription>The core personality instructions for the AI.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="styleTags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Tags (for filtering)</FormLabel>
                      <FormControl>
                        <Input placeholder="Romantic, Shy, Bollywood, Funny, Bold" {...field} className="!rounded-lg"/>
                      </FormControl>
                      <FormDescription>Comma-separated list of tags.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultVoiceTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Voice Tone (for TTS later)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Sweet and playful Hinglish" {...field} className="!rounded-lg"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="dataAiHint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image AI Hint (Optional, for placeholders)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., indian woman smile" {...field} className="!rounded-lg"/>
                      </FormControl>
                      <FormDescription>Short hint (1-2 words) for AI image generation if a placeholder is used for the avatar.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="messageBubbleStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Bubble Style (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., pink-gradient (CSS class or key)" {...field} className="!rounded-lg"/>
                      </FormControl>
                       <FormDescription>Custom style identifier for chat messages.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="animatedEmojiResponse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Animated Emoji Response URL (Optional, for card hover)</FormLabel>
                      <FormControl>
                        <Input placeholder="URL to Lottie/GIF" {...field} className="!rounded-lg"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="audioGreetingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audio Greeting URL (Optional, for card hover)</FormLabel>
                      <FormControl>
                        <Input placeholder="URL to short audio clip" {...field} className="!rounded-lg"/>
                      </FormControl>
                      <FormMessage />
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
                          name={field.name} // Ensure name is passed for FormData
                        />
                      </FormControl>
                      <FormMessage /> {/* Added missing FormMessage here */}
                    </FormItem>
                  )}
                />
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
