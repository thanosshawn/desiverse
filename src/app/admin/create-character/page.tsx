
// src/app/admin/create-character/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Kept for action buttons outside the form
import { useToast } from '@/hooks/use-toast';
import { createCharacterAction, type CreateCharacterActionState } from '../../actions';
import type { CharacterCreationAdminFormValues } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { uploadCharacterAsset } from '@/lib/supabase/client';
import { Loader2, LogOut, ListChecks, RefreshCw, BarChart3, BookOpenCheck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
              <p className="text-lg mt-2">Checking admin status...</p>
            </main>
        </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
        <div className="flex flex-col min-h-screen">
             <Header />
            <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center">
              <p className="text-lg">Redirecting to login...</p>
              <Loader2 className="h-8 w-8 animate-spin mt-4 text-primary"/>
            </main>
        </div>
    );
  }

  const isSubmitting = form.formState.isSubmitting || isUploadingAvatar || isUploadingBackground;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-headline text-primary mb-1">Create New AI Character</h1>
            <p className="text-sm">
                Autofilled with random data. Click
                <RefreshCw
                    className="inline h-4 w-4 text-accent align-middle cursor-pointer mx-1"
                    onClick={handleRegenerateDefaults}
                    title="Regenerate autofill data"
                />
                to regenerate.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-6 justify-center md:justify-start">
              <Button variant="outline" size="sm" onClick={handleRegenerateDefaults} title="Regenerate autofill data">
                  <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
              <Link href="/admin/manage-characters" passHref>
                  <Button variant="outline" size="sm" title="Manage existing characters">
                      <ListChecks className="mr-2 h-4 w-4" /> Manage Chars
                  </Button>
              </Link>
              <Link href="/admin/create-story" passHref>
                  <Button variant="outline" size="sm" title="Create new story">
                      <BookOpenCheck className="mr-2 h-4 w-4" /> Create Story
                  </Button>
              </Link>
               <Link href="/admin/analytics" passHref>
                  <Button variant="outline" size="sm" title="View Analytics">
                      <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                  </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} title="Logout from admin">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
          </div>

            <form action={formAction} className="space-y-4" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
              {state.message && (
                <p style={{ color: state.success ? 'green' : 'red' }}>{state.message}</p>
              )}

              <div>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Character Name</label>
                <input type="text" id="name" {...form.register("name")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>

              <div>
                <label htmlFor="personalitySnippet" style={{ display: 'block', marginBottom: '5px' }}>Personality Snippet (for character card)</label>
                <input type="text" id="personalitySnippet" {...form.register("personalitySnippet")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>A short, catchy tagline displayed on the character selection card.</p>
              </div>

              <div>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Full Description (for AI context, can be longer)</label>
                <textarea id="description" {...form.register("description")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} rows={3}></textarea>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Detailed background for the AI's personality and for display (if needed).</p>
              </div>

              <div>
                <label htmlFor="avatarFile" style={{ display: 'block', marginBottom: '5px' }}>Avatar Image</label>
                <input
                  type="file"
                  id="avatarFile"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                  disabled={isUploadingAvatar}
                  style={{ marginBottom: '5px' }}
                />
                {isUploadingAvatar && <p style={{ fontSize: '0.8rem', color: '#666' }}><Loader2 className="inline mr-1 h-4 w-4 animate-spin" />Uploading avatar...</p>}
                <input type="text" {...form.register("avatarUrl")} placeholder="Supabase Avatar URL (auto-filled or default)" readOnly={isUploadingAvatar} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#eee' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Public URL from Supabase or a placeholder (e.g., https://placehold.co/400x600.png).</p>
              </div>

              <div>
                <label htmlFor="backgroundFile" style={{ display: 'block', marginBottom: '5px' }}>Background Image (Optional for Chat)</label>
                <input
                  type="file"
                  id="backgroundFile"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => handleFileUpload(e, 'background')}
                  disabled={isUploadingBackground}
                  style={{ marginBottom: '5px' }}
                />
                {isUploadingBackground && <p style={{ fontSize: '0.8rem', color: '#666' }}><Loader2 className="inline mr-1 h-4 w-4 animate-spin" />Uploading background...</p>}
                <input type="text" {...form.register("backgroundImageUrl")} placeholder="Supabase Background URL (auto-filled or default)" readOnly={isUploadingBackground} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#eee' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Public URL from Supabase or a placeholder (e.g., https://placehold.co/1200x800.png).</p>
              </div>

              <div>
                <label htmlFor="basePrompt" style={{ display: 'block', marginBottom: '5px' }}>Base Prompt (AI Personality Core)</label>
                <textarea id="basePrompt" {...form.register("basePrompt")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} rows={6}></textarea>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>The core personality instructions for the AI. Be descriptive!</p>
              </div>

              <div>
                <label htmlFor="styleTags" style={{ display: 'block', marginBottom: '5px' }}>Style Tags (for filtering & AI context)</label>
                <input type="text" id="styleTags" {...form.register("styleTags")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Comma-separated list of tags for discoverability and AI prompt refinement.</p>
              </div>

              <div>
                <label htmlFor="defaultVoiceTone" style={{ display: 'block', marginBottom: '5px' }}>Default Voice Tone (for future TTS)</label>
                <input type="text" id="defaultVoiceTone" {...form.register("defaultVoiceTone")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Describes the character's voice style for text-to-speech generation.</p>
              </div>

              <div>
                <label htmlFor="dataAiHint" style={{ display: 'block', marginBottom: '5px' }}>Image AI Hint (for avatar placeholders)</label>
                <input type="text" id="dataAiHint" {...form.register("dataAiHint")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Short hint (1-2 words) if using a generic placeholder image for the avatar.</p>
              </div>

              <div>
                <label htmlFor="messageBubbleStyle" style={{ display: 'block', marginBottom: '5px' }}>Message Bubble Style</label>
                <input type="text" id="messageBubbleStyle" {...form.register("messageBubbleStyle")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Custom style identifier for this character's chat messages (e.g., a CSS class).</p>
              </div>

              <div>
                <label htmlFor="animatedEmojiResponse" style={{ display: 'block', marginBottom: '5px' }}>Animated Emoji/Sticker URL (for card hover)</label>
                <input type="text" id="animatedEmojiResponse" {...form.register("animatedEmojiResponse")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Link to a small animation displayed on character card interactions.</p>
              </div>

              <div>
                <label htmlFor="audioGreetingUrl" style={{ display: 'block', marginBottom: '5px' }}>Audio Greeting URL (for card hover)</label>
                <input type="text" id="audioGreetingUrl" {...form.register("audioGreetingUrl")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Link to a brief audio greeting for character card interactions.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                <input
                  type="checkbox"
                  id="isPremium"
                  {...form.register("isPremium")}
                  style={{ width: '16px', height: '16px' }}
                />
                <div>
                  <label htmlFor="isPremium" style={{ fontWeight: '500' }}>Premium Character</label>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Mark this character as premium (requires subscription to chat).</p>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: isSubmitting ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', width: '100%', fontSize: '1rem' }}>
                {isSubmitting ? <><Loader2 className="inline mr-2 h-5 w-5 animate-spin"/>Processing...</> : 'Create Character'}
              </button>
            </form>
        </div>
      </main>
    </div>
  );
}

    