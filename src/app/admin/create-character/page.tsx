// src/app/admin/create-character/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createCharacterAction, type CreateCharacterActionState } from '../actions'; 
import type { CharacterCreationFormSchema } from '@/lib/types';
import { Header } from '@/components/layout/header'; // Assuming you have a Header component

const characterFormZodSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(50, 'Name must be 50 characters or less.'),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500, 'Description must be 500 characters or less.'),
  avatarUrl: z.string().url('Please enter a valid URL. Placeholder: https://placehold.co/300x300.png'),
  backgroundImageUrl: z.string().url('Please enter a valid URL. Placeholder: https://placehold.co/600x400.png').optional().or(z.literal('')),
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
        form.reset(); // Reset form on successful creation
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
  
  // Watch for server-side errors to set on form fields
  useEffect(() => {
    if (state.errors) {
      for (const [fieldName, fieldErrors] of Object.entries(state.errors)) {
        if (fieldErrors && fieldErrors.length > 0) {
          form.setError(fieldName as keyof CharacterCreationFormSchema, {
            type: 'server',
            message: fieldErrors[0],
          });
        }
      }
    }
  }, [state.errors, form]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Create New AI Character</CardTitle>
            <CardDescription>Fill in the details for your new DesiBae character.</CardDescription>
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
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://your-supabase-url.com/character-assets/avatars/char.png" {...field} />
                      </FormControl>
                      <FormDescription>URL of the character's avatar image (e.g., from Supabase Storage).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="backgroundImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://your-supabase-url.com/character-assets/backgrounds/char_bg.jpg" {...field} />
                      </FormControl>
                       <FormDescription>URL of the character's background image.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormDescription>Short hint (1-2 words) for AI image generation if a placeholder is used.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Character'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
