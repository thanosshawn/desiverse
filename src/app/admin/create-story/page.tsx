// src/app/admin/create-story/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createStoryAction, type CreateStoryActionState } from '../actions';
import type { InteractiveStoryAdminFormValues, CharacterMetadata } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { uploadCharacterAsset } from '@/lib/supabase/client'; // Re-use for cover image
import { Loader2, LogOut, CheckSquare, ListChecks, Sparkles, ImagePlus, Brain, Settings2, Info, BookOpenCheck, BarChart3, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { getAllCharacters } from '@/lib/firebase/rtdb';

const initialState: CreateStoryActionState = {
  message: '',
  success: false,
  errors: null,
};

export default function CreateStoryPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<InteractiveStoryAdminFormValues>({
    defaultValues: {
      title: 'The Secret of the Lost Temple',
      description: 'An adventurous journey to uncover ancient secrets with your Bae.',
      characterId: '',
      coverImageUrl: 'https://placehold.co/800x450.png', // Default placeholder for cover
      tagsString: 'Adventure, Romance, Mystery',
      initialSceneSummary: 'You find a mysterious map hinting at a lost temple. Your Bae looks at you with excitement, ready for an adventure. "Should we follow it?" she asks.',
    },
  });

  const [state, formAction] = useActionState(createStoryAction, initialState);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [characters, setCharacters] = useState<CharacterMetadata[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);

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
    if (isAdminLoggedIn) {
      const fetchChars = async () => {
        try {
          const chars = await getAllCharacters();
          setCharacters(chars);
          if (chars.length > 0 && !form.getValues('characterId')) {
            form.setValue('characterId', chars[0].id); // Set default character if none selected
          }
        } catch (error) {
          toast({ title: 'Error', description: 'Could not load characters.', variant: 'destructive' });
        } finally {
          setLoadingCharacters(false);
        }
      };
      fetchChars();
    }
  }, [isAdminLoggedIn, form, toast]);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Error Creating Story',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        // Optionally reset form or redirect
        form.reset({ // Reset with some defaults, maybe not all
            title: '',
            description: '',
            characterId: characters.length > 0 ? characters[0].id : '',
            coverImageUrl: 'https://placehold.co/800x450.png',
            tagsString: '',
            initialSceneSummary: '',
        });
      }
    }
  }, [state, toast, form, characters]);

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      // Using 'backgrounds' as a generic folder, or create a 'story-covers' one
      const publicUrl = await uploadCharacterAsset(file, 'backgrounds');
      form.setValue('coverImageUrl', publicUrl, { shouldValidate: true });
      toast({ title: 'Cover Image Uploaded', description: 'Cover image URL populated.' });
    } catch (error: any) {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploadingCover(false);
      if (event.target) event.target.value = ''; // Clear file input
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    toast({ title: 'Logged Out', description: 'You have been logged out as admin.' });
    router.replace('/admin/login');
  };

  if (!authStatusChecked || (isAdminLoggedIn && loadingCharacters)) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
          <p className="text-lg mt-2 text-muted-foreground">
            {authStatusChecked ? 'Loading resources...' : 'Checking admin status...'}
          </p>
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

  const isSubmitting = form.formState.isSubmitting || isUploadingCover;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8">
        <Card className="max-w-3xl mx-auto bg-card/90 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6">
            <div className="flex-grow">
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <BookOpenCheck className="mr-2 h-6 w-6" /> Create New Interactive Story
              </CardTitle>
              <CardDescription>Define the story's plot, character, and starting point.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              <Link href="/admin/create-character" passHref className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Create new character">
                      <PlusCircle className="mr-2 h-4 w-4"/> Create Char
                  </Button>
              </Link>
              <Link href="/admin/manage-characters" passHref className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Manage existing characters">
                  <ListChecks className="mr-2 h-4 w-4" /> Manage Chars
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
                  <h3 className="text-lg font-semibold text-primary flex items-center"><Info className="mr-2 h-5 w-5 text-accent" />Story Details</h3>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Story Title</FormLabel>
                        <FormControl><Input placeholder="e.g., The Midnight Train to Shimla" {...field} className="!rounded-lg" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Story Description</FormLabel>
                        <FormControl><Textarea placeholder="A brief summary of what the story is about." {...field} className="!rounded-lg" rows={3} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="characterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protagonist Character</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={loadingCharacters}>
                          <FormControl>
                            <SelectTrigger className="!rounded-lg">
                              <SelectValue placeholder="Select a character for this story" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {characters.map(char => (
                              <SelectItem key={char.id} value={char.id}>{char.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>The AI character who will lead this story.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center"><ImagePlus className="mr-2 h-5 w-5 text-accent" />Story Visuals</h3>
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleCoverImageUpload}
                        className="mb-2 file:mr-4 file:py-2 file:px-4 file:!rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 !rounded-lg"
                        disabled={isUploadingCover}
                      />
                    </FormControl>
                    {isUploadingCover && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading cover...</div>}
                    <FormField
                      control={form.control}
                      name="coverImageUrl"
                      render={({ field }) => (
                        <>
                          <FormControl>
                            <Input placeholder="Supabase Cover Image URL (auto-filled or default)" {...field} value={field.value || ''} disabled={isUploadingCover} className="!rounded-lg" />
                          </FormControl>
                          <FormDescription>Public URL from Supabase (e.g., https://placehold.co/800x450.png).</FormDescription>
                        </>
                      )}
                    />
                  </FormItem>
                   <FormField
                    control={form.control}
                    name="tagsString"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Story Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="Adventure, Romance, Mystery" {...field} className="!rounded-lg"/>
                        </FormControl>
                        <FormDescription>Comma-separated list of tags for discoverability.</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center"><Brain className="mr-2 h-5 w-5 text-accent" />Story AI Setup</h3>
                  <FormField
                    control={form.control}
                    name="initialSceneSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Scene Prompt / Summary</FormLabel>
                        <FormControl>
                          <Textarea rows={5} placeholder="Describe the starting situation. This will be given to the AI to generate the first turn of the story. e.g., You and your Bae, {{characterName}}, are walking through a misty forest when you stumble upon an ancient, glowing amulet..." {...field} className="!rounded-lg"/>
                        </FormControl>
                        <FormDescription>The very first prompt for the AI to kick off the story. Be descriptive and engaging!</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground !rounded-xl text-lg py-3 shadow-lg" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckSquare className="mr-2 h-5 w-5"/>}
                  {isSubmitting ? 'Processing...' : 'Create Story'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
