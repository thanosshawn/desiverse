
// src/app/admin/edit-character/[characterId]/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button'; // Kept for action buttons outside the form
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { Loader2, LogOut, ListChecks, Edit2, BookOpenCheck, FileText } from 'lucide-react';
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

  const form = useForm<CharacterCreationAdminFormValues>({
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
        isPremium: false, // Ensure boolean default
    }
  });
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
            styleTags: charData.styleTags.join(', '),
            backgroundImageUrl: charData.backgroundImageUrl || '',
            messageBubbleStyle: charData.messageBubbleStyle || '',
            animatedEmojiResponse: charData.animatedEmojiResponse || '',
            audioGreetingUrl: charData.audioGreetingUrl || '',
            isPremium: charData.isPremium || false, // Ensure boolean
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
    }
  }, [state, toast]);

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
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
          <p className="text-lg mt-2">
            {authStatusChecked ? 'Loading character data...' : 'Checking admin status...'}
          </p>
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

  if (characterNotFound) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center text-center">
          <Edit2 className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">Character Not Found</h1>
          <p className="mb-4">The character you are trying to edit does not exist or could not be loaded.</p>
          <Link href="/admin/manage-characters" passHref>
            <Button variant="outline">Back to Manage Characters</Button>
          </Link>
        </main>
      </div>
    );
  }

  const isFormSubmitting = isPending || isUploadingAvatar || isUploadingBackground;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-headline text-primary mb-1 flex items-center">
                <Edit2 className="mr-2 h-6 w-6" /> Edit Character: {form.getValues('name')}
            </h1>
            <p className="text-sm">Modify the details for this AI character.</p>
          </div>
           <div className="flex flex-wrap items-center gap-2 mb-6 justify-center md:justify-start">
              <Link href="/admin/manage-characters" passHref>
                <Button variant="outline" size="sm" title="Back to manage characters">
                  <ListChecks className="mr-2 h-4 w-4" /> Manage All Chars
                </Button>
              </Link>
               <Link href="/admin/create-story" passHref>
                <Button variant="outline" size="sm" title="Create new story">
                    <BookOpenCheck className="mr-2 h-4 w-4" /> Create Story
                </Button>
              </Link>
              <Link href="/admin/manage-stories" passHref>
                <Button variant="outline" size="sm" title="Manage existing stories">
                    <FileText className="mr-2 h-4 w-4"/> Manage Stories
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
                <label htmlFor="personalitySnippet" style={{ display: 'block', marginBottom: '5px' }}>Personality Snippet</label>
                <input type="text" id="personalitySnippet" {...form.register("personalitySnippet")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>A short, catchy tagline displayed on the character selection card.</p>
              </div>

              <div>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Full Description</label>
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
                <input type="text" {...form.register("avatarUrl")} placeholder="Supabase Avatar URL" readOnly={isUploadingAvatar} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#eee' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Public URL from Supabase or a placeholder.</p>
              </div>

              <div>
                <label htmlFor="backgroundFile" style={{ display: 'block', marginBottom: '5px' }}>Background Image (Optional)</label>
                 <input
                  type="file"
                  id="backgroundFile"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => handleFileUpload(e, 'background')}
                  disabled={isUploadingBackground}
                  style={{ marginBottom: '5px' }}
                />
                {isUploadingBackground && <p style={{ fontSize: '0.8rem', color: '#666' }}><Loader2 className="inline mr-1 h-4 w-4 animate-spin" />Uploading background...</p>}
                <input type="text" {...form.register("backgroundImageUrl")} placeholder="Supabase Background URL" readOnly={isUploadingBackground} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#eee' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Public URL from Supabase or a placeholder.</p>
              </div>

              <div>
                <label htmlFor="basePrompt" style={{ display: 'block', marginBottom: '5px' }}>Base Prompt</label>
                <textarea id="basePrompt" {...form.register("basePrompt")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} rows={6}></textarea>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>The core personality instructions for the AI.</p>
              </div>

              <div>
                <label htmlFor="styleTags" style={{ display: 'block', marginBottom: '5px' }}>Style Tags</label>
                <input type="text" id="styleTags" {...form.register("styleTags")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Comma-separated list of tags.</p>
              </div>

              <div>
                <label htmlFor="defaultVoiceTone" style={{ display: 'block', marginBottom: '5px' }}>Default Voice Tone</label>
                <input type="text" id="defaultVoiceTone" {...form.register("defaultVoiceTone")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Describes the character's voice style for TTS.</p>
              </div>

              <div>
                <label htmlFor="dataAiHint" style={{ display: 'block', marginBottom: '5px' }}>Image AI Hint</label>
                <input type="text" id="dataAiHint" {...form.register("dataAiHint")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Short hint (1-2 words) for placeholder images.</p>
              </div>

              <div>
                <label htmlFor="messageBubbleStyle" style={{ display: 'block', marginBottom: '5px' }}>Message Bubble Style</label>
                <input type="text" id="messageBubbleStyle" {...form.register("messageBubbleStyle")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Custom style identifier for chat messages.</p>
              </div>

              <div>
                <label htmlFor="animatedEmojiResponse" style={{ display: 'block', marginBottom: '5px' }}>Animated Emoji/Sticker URL</label>
                <input type="text" id="animatedEmojiResponse" {...form.register("animatedEmojiResponse")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Link to animation for card interactions.</p>
              </div>

              <div>
                <label htmlFor="audioGreetingUrl" style={{ display: 'block', marginBottom: '5px' }}>Audio Greeting URL</label>
                <input type="text" id="audioGreetingUrl" {...form.register("audioGreetingUrl")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Link to brief audio greeting.</p>
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

              <button type="submit" disabled={isFormSubmitting} style={{ padding: '10px 20px', backgroundColor: isFormSubmitting ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: isFormSubmitting ? 'not-allowed' : 'pointer', width: '100%', fontSize: '1rem' }}>
                {isFormSubmitting ? <><Loader2 className="inline mr-2 h-5 w-5 animate-spin"/>Saving...</> : 'Update Character'}
              </button>
            </form>
        </div>
      </main>
    </div>
  );
}
