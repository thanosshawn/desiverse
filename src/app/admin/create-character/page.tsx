// src/app/admin/create-character/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createCharacterAction, type CreateCharacterActionState } from '../actions';
import type { CharacterCreationFormSchema } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { uploadCharacterAsset } from '@/lib/supabase/client'; // Import Supabase upload function
import { Loader2 } from 'lucide-react';

const characterFormZodSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be 50 characters or less.'),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500, 'Description must be 500 characters or less.'),
  avatarUrl: z.string().url('Please enter a valid Supabase public URL. e.g., https://your-project-ref.supabase.co/storage/v1/object/public/character-assets/avatars/char.png'),
  backgroundImageUrl: z.string().url('Please enter a valid Supabase public URL. e.g., https://your-project-ref.supabase.co/storage/v1/object/public/character-assets/backgrounds/char_bg.jpg').optional().or(z.literal('')),
  basePrompt: z.string().min(20, 'Base prompt must be at least 20 characters.'),
  styleTags: z.string().min(1, 'Please enter at least one style tag (comma-separated).'),
  defaultVoiceTone: z.string().min(2, 'Default voice tone must be at least 2 characters.'),
  dataAiHint: z.string().max(30, 'AI hint should be short, max 2 words. E.g., "indian woman"').optional(),
});

const initialState: CreateCharacterActionState = {
  message: '',
  success: false,
  errors: null,
};

export default function CreateCharacterPage() {
  const { toast } = useToast();
  const [state, formAction] = useFormState(createCharacterAction, initialState);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  const form = useForm<CharacterCreationFormSchema>({
    resolver: zodResolver(characterFormZodSchema),
    defaultValues: {
      name: '',
      description: '',
      avatarUrl: '',
      backgroundImageUrl: '',
      basePrompt: '',
      styleTags: '',
      defaultVoiceTone: '',
      dataAiHint: '',
    },
  });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        form.reset(); 
      }
    }
    if (state.errors) {
        (Object.keys(state.errors) as Array<keyof CharacterCreationFormSchema>).forEach((key) => {
            if (state.errors && state.errors[key] && state.errors[key]?.[0]) {
                 form.setError(key, { type: 'server', message: state.errors[key]?.[0] });
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
      toast({
        title: `Upload Error (${fileType})`,
        description: error.message || 'Failed to upload file.',
        variant: 'destructive',
      });
    } finally {
      if (fileType === 'avatar') setIsUploadingAvatar(false);
      if (fileType === 'background') setIsUploadingBackground(false);
      // Reset file input to allow re-uploading the same file if needed
      event.target.value = '';
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Create New AI Character</CardTitle>
            <CardDescription>Fill in the details for your new DesiBae character. You can upload images or paste public URLs from Supabase.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form action={formAction} className="space-y-6">
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Character Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Simran" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A shy, poetic girl from Delhi who loves chai..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Avatar URL and Upload */}
                <FormItem>
                  <FormLabel>Avatar Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => handleFileUpload(e, 'avatar')}
                      className="mb-2"
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
                          <Input placeholder="Paste Avatar URL or upload above" {...field} disabled={isUploadingAvatar} />
                        </FormControl>
                        <FormDescription>Public URL from Supabase. (e.g., https://project-ref.supabase.co/.../avatar.png)</FormDescription>
                        <FormMessage />
                      </>
                    )}
                  />
                </FormItem>

                {/* Background Image URL and Upload */}
                 <FormItem>
                  <FormLabel>Background Image (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => handleFileUpload(e, 'background')}
                      className="mb-2"
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
                          <Input placeholder="Paste Background URL or upload above" {...field} disabled={isUploadingBackground} />
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
                      <FormLabel>Base Prompt (Personality)</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="You are [Name], a [adjectives] AI companion who..." {...field} />
                      </FormControl>
                      <FormDescription>The core personality prompt for the AI.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="styleTags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="romantic, shy, Bollywood fan" {...field} />
                      </FormControl>
                      <FormDescription>Comma-separated list of personality/style tags.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultVoiceTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Voice Tone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Riya or soft playful Hinglish" {...field} />
                      </FormControl>
                      <FormDescription>Describes the character's voice style. Should match a valid CharacterName enum or be descriptive.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="dataAiHint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image AI Hint (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., indian woman" {...field} />
                      </FormControl>
                      <FormDescription>Short hint (1-2 words) for AI image generation if a placeholder is used for the avatar (via placehold.co).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting || isUploadingAvatar || isUploadingBackground}>
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
