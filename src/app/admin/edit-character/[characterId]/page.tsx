// src/app/admin/edit-character/[characterId]/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { Loader2, LogOut, Save, ListChecks, ImagePlus, Brain, Settings2, Info, AlertTriangle, Edit2 } from 'lucide-react';
import { getCharacterMetadata } from '@/lib/firebase/rtdb';
import { uploadCharacterAsset } from '@/lib/supabase/client';
import type { CharacterMetadata, CharacterCreationAdminFormValues } from '@/lib/types';
import { updateCharacterAction, type UpdateCharacterActionState } from '../../actions';

const initialState: UpdateCharacterActionState = {
  message: '',
  success: false,
  errors: null,
};

export default function EditCharacterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const characterId = params.characterId as string;

  const form = useForm<CharacterCreationAdminFormValues>();
  const [state, formAction, isPending] = useActionState(updateCharacterAction.bind(null, characterId), initialState);

  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true);
  const [characterNotFound, setCharacterNotFound] = useState(false);
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
    if (!characterId || !isAdminLoggedIn) return;

    const fetchCharacter = async () => {
      setIsLoadingCharacter(true);
      try {
        const charData = await getCharacterMetadata(characterId);
        if (charData) {
          form.reset({
            ...charData,
            styleTags: charData.styleTags.join(', '), // Convert array to comma-separated string for input
            backgroundImageUrl: charData.backgroundImageUrl || '',
            messageBubbleStyle: charData.messageBubbleStyle || '',
            animatedEmojiResponse: charData.animatedEmojiResponse || '',
            audioGreetingUrl: charData.audioGreetingUrl || '',
            isPremium: charData.isPremium || false, // Ensure isPremium has a boolean value
          });
        } else {
          setCharacterNotFound(true);
          toast({ title: 'Error', description: 'Character not found.', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error fetching character:', error);
        toast({ title: 'Error', description: 'Failed to load character data.', variant: 'destructive' });
        setCharacterNotFound(true);
      } finally {
        setIsLoadingCharacter(false);
      }
    };
    fetchCharacter();
  }, [characterId, form, toast, isAdminLoggedIn]);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Error Updating Character',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        // Optionally redirect or clear form, but for edit, usually stay on page
        // router.push('/admin/manage-characters');
      }
    }
  }, [state, toast, router]);

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
        toast({ title: 'Avatar Updated', description: 'New avatar URL set.' });
      } else {
        form.setValue('backgroundImageUrl', publicUrl, { shouldValidate: true });
        toast({ title: 'Background Image Updated', description: 'New background URL set.' });
      }
    } catch (error: any) {
      toast({ title: `Upload Error (${fileType})`, description: error.message, variant: 'destructive' });
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

  if (!authStatusChecked || (isAdminLoggedIn && isLoadingCharacter)) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
          <p className="text-lg mt-2 text-muted-foreground">
            {authStatusChecked ? 'Loading character data...' : 'Checking admin status...'}
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

  if (characterNotFound) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">Character Not Found</h1>
          <p className="text-muted-foreground mb-4">The character you are trying to edit does not exist or could not be loaded.</p>
          <Link href="/admin/manage-characters" passHref>
            <Button variant="outline" className="!rounded-lg">Back to Manage Characters</Button>
          </Link>
        </main>
      </div>
    );
  }
  
  const isFormSubmitting = isPending || isUploadingAvatar || isUploadingBackground;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8">
        <Card className="max-w-3xl mx-auto bg-card/90 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6">
            <div className="flex-grow">
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <Edit2 className="mr-2 h-6 w-6" /> Edit Character: {form.getValues('name')}
              </CardTitle>
              <CardDescription>Modify the details for this AI character.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              <Link href="/admin/manage-characters" passHref className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Back to manage characters">
                  <ListChecks className="mr-2 h-4 w-4" /> Manage All
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
                        <FormControl><Input {...field} className="!rounded-lg" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalitySnippet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personality Snippet</FormLabel>
                        <FormControl><Input {...field} className="!rounded-lg" /></FormControl>
                         <FormDescription>A short, catchy tagline displayed on the character selection card.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Description</FormLabel>
                        <FormControl><Textarea {...field} className="!rounded-lg" rows={3} /></FormControl>
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
                          <FormControl><Input {...field} disabled={isUploadingAvatar} className="!rounded-lg" /></FormControl>
                          <FormDescription>Public URL from Supabase or a placeholder.</FormDescription>
                        </>
                      )}
                    />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Background Image (Optional)</FormLabel>
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
                          <FormControl><Input {...field} disabled={isUploadingBackground} className="!rounded-lg"/></FormControl>
                          <FormDescription>Public URL from Supabase or a placeholder.</FormDescription>
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
                        <FormLabel>Base Prompt</FormLabel>
                        <FormControl><Textarea rows={6} {...field} className="!rounded-lg"/></FormControl>
                        <FormDescription>The core personality instructions for the AI.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="styleTags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style Tags</FormLabel>
                        <FormControl><Input {...field} className="!rounded-lg"/></FormControl>
                        <FormDescription>Comma-separated list of tags.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultVoiceTone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Voice Tone</FormLabel>
                        <FormControl><Input {...field} className="!rounded-lg"/></FormControl>
                        <FormDescription>Describes the character's voice style for TTS.</FormDescription>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="dataAiHint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image AI Hint</FormLabel>
                        <FormControl><Input {...field} className="!rounded-lg"/></FormControl>
                        <FormDescription>Short hint (1-2 words) for placeholder images.</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                <Separator className="my-6" />

                <div className="space-y-4">
                   <h3 className="text-lg font-semibold text-primary flex items-center"><Settings2 className="mr-2 h-5 w-5 text-accent" />Advanced Settings</h3>
                   <FormField
                    control={form.control}
                    name="messageBubbleStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Bubble Style</FormLabel>
                        <FormControl><Input {...field} className="!rounded-lg"/></FormControl>
                        <FormDescription>Custom style identifier for chat messages.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="animatedEmojiResponse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Animated Emoji/Sticker URL</FormLabel>
                        <FormControl><Input {...field} className="!rounded-lg"/></FormControl>
                        <FormDescription>Link to animation for card interactions.</FormDescription>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="audioGreetingUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audio Greeting URL</FormLabel>
                        <FormControl><Input {...field} className="!rounded-lg"/></FormControl>
                        <FormDescription>Link to brief audio greeting.</FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isPremium"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Premium Character</FormLabel>
                          <FormDescription>
                            Mark this character as premium (requires subscription to chat).
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={!!field.value} // Ensure value is explicitly boolean for Switch
                            onCheckedChange={field.onChange}
                            name={field.name}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground !rounded-xl text-lg py-3 shadow-lg" disabled={isFormSubmitting}>
                  {isFormSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5"/>}
                  {isFormSubmitting ? 'Saving...' : 'Update Character'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}

