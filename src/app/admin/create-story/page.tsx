
// src/app/admin/create-story/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createStoryAction, generateStoryIdeaAction, type CreateStoryActionState } from '../actions';
import type { InteractiveStoryAdminFormValues, CharacterMetadata } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { uploadCharacterAsset } from '@/lib/supabase/client';
import { Loader2, LogOut, ListChecks, BookOpenCheck, BarChart3, PlusCircle, FileText, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { getAllCharacters } from '@/lib/firebase/rtdb';

const initialState: CreateStoryActionState = {
  message: '',
  success: false,
  errors: null,
};

const defaultFormValues: InteractiveStoryAdminFormValues = {
  title: '',
  description: '',
  characterId: '',
  coverImageUrl: 'https://placehold.co/800x450.png',
  tagsString: '',
  initialSceneSummary: '',
};

export default function CreateStoryPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<InteractiveStoryAdminFormValues>({
    defaultValues: defaultFormValues,
  });

  const [state, formAction, isPending] = useActionState(createStoryAction, initialState);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [characters, setCharacters] = useState<CharacterMetadata[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

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
            form.setValue('characterId', chars[0].id);
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
        handleClearForm();
      }
    }
  }, [state, toast]);

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const publicUrl = await uploadCharacterAsset(file, 'backgrounds');
      form.setValue('coverImageUrl', publicUrl, { shouldValidate: true });
      toast({ title: 'Cover Image Uploaded', description: 'Cover image URL populated.' });
    } catch (error: any) {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploadingCover(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    toast({ title: 'Logged Out', description: 'You have been logged out as admin.' });
    router.replace('/admin/login');
  };

  const handleGenerateStoryIdea = async () => {
    const characterId = form.getValues('characterId');
    if (!characterId) {
      toast({
        title: 'Select a Character',
        description: 'Please select a character first to generate a personalized story idea.',
        variant: 'destructive',
      });
      return;
    }
    setIsGeneratingIdea(true);
    try {
      const result = await generateStoryIdeaAction(characterId);
      if (result.success && result.storyIdea) {
        const { title, description, tagsString, initialSceneSummary } = result.storyIdea;
        form.reset({
          ...form.getValues(),
          title,
          description,
          tagsString,
          initialSceneSummary,
        });
        toast({
          title: '✨ Story Idea Generated!',
          description: `A new story premise for "${result.storyIdea.title}" has been filled in.`,
        });
      } else {
        toast({
          title: 'AI Generation Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while generating the story idea.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const handleClearForm = () => {
    form.reset({
        ...defaultFormValues,
        characterId: characters.length > 0 ? characters[0].id : '',
    });
    toast({ title: "Form Cleared", description: "You can start over now." });
  };

  if (!authStatusChecked || (isAdminLoggedIn && loadingCharacters)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
          <p className="text-lg mt-2">
            {authStatusChecked ? 'Loading resources...' : 'Checking admin status...'}
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

  const isSubmitting = isPending || isUploadingCover;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8">
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 text-center md:text-left">
                <h1 className="text-2xl font-headline text-primary mb-1 flex items-center">
                    <BookOpenCheck className="mr-2 h-6 w-6" /> Create New Interactive Story
                </h1>
                <p className="text-sm">Define the story's plot, character, and starting point.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-6 justify-center md:justify-start">
              <Button variant="outline" size="sm" onClick={handleGenerateStoryIdea} disabled={isGeneratingIdea || loadingCharacters} title="Generate story idea with AI">
                  {isGeneratingIdea ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />}
                  Generate Idea
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearForm} title="Clear the form">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Form
              </Button>
              <Link href="/admin/create-character" passHref>
                  <Button variant="outline" size="sm" title="Create new character">
                      <PlusCircle className="mr-2 h-4 w-4"/> Create Char
                  </Button>
              </Link>
              <Link href="/admin/manage-characters" passHref>
                <Button variant="outline" size="sm" title="Manage existing characters">
                  <ListChecks className="mr-2 h-4 w-4" /> Manage Chars
                </Button>
              </Link>
              <Link href="/admin/manage-stories" passHref>
                  <Button variant="outline" size="sm" title="Manage existing stories">
                      <FileText className="mr-2 h-4 w-4"/> Manage Stories
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
              {state.message && !state.success && (
                <p style={{ color: 'red' }}>{state.message}</p>
              )}
              {state.errors?.characterId && <p style={{color: 'red', fontSize: '0.8rem'}}>{state.errors.characterId.join(', ')}</p>}

              <div>
                <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Story Title</label>
                <input type="text" id="title" {...form.register("title")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                {state.errors?.title && <p style={{color: 'red', fontSize: '0.8rem'}}>{state.errors.title.join(', ')}</p>}
              </div>

              <div>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Story Description</label>
                <textarea id="description" {...form.register("description")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} rows={3}></textarea>
                 {state.errors?.description && <p style={{color: 'red', fontSize: '0.8rem'}}>{state.errors.description.join(', ')}</p>}
              </div>

              <div>
                <label htmlFor="characterId" style={{ display: 'block', marginBottom: '5px' }}>Protagonist Character</label>
                <select
                  id="characterId"
                  {...form.register("characterId")}
                  disabled={loadingCharacters}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: loadingCharacters ? '#eee' : 'white' }}
                >
                  <option value="">Select a character...</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>The AI character who will lead this story.</p>
                 {state.errors?.characterId && <p style={{color: 'red', fontSize: '0.8rem'}}>{state.errors.characterId.join(', ')}</p>}
              </div>

              <div>
                <label htmlFor="coverImageFile" style={{ display: 'block', marginBottom: '5px' }}>Cover Image</label>
                <input
                  type="file"
                  id="coverImageFile"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleCoverImageUpload}
                  disabled={isUploadingCover}
                  style={{ marginBottom: '5px' }}
                />
                {isUploadingCover && <p style={{ fontSize: '0.8rem', color: '#666' }}><Loader2 className="inline mr-1 h-4 w-4 animate-spin" />Uploading cover...</p>}
                <input type="text" {...form.register("coverImageUrl")} placeholder="Supabase Cover Image URL (auto-filled or default)" readOnly={isUploadingCover} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#eee' }}/>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Public URL from Supabase (e.g., https://placehold.co/800x450.png).</p>
              </div>

               <div>
                <label htmlFor="tagsString" style={{ display: 'block', marginBottom: '5px' }}>Story Tags</label>
                <input type="text" id="tagsString" {...form.register("tagsString")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Comma-separated list of tags for discoverability.</p>
              </div>

              <div>
                <label htmlFor="initialSceneSummary" style={{ display: 'block', marginBottom: '5px' }}>Initial Scene Prompt / Summary</label>
                <textarea id="initialSceneSummary" {...form.register("initialSceneSummary")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} rows={5}></textarea>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>The very first prompt for the AI to kick off the story. Be descriptive and engaging!</p>
                {state.errors?.initialSceneSummary && <p style={{color: 'red', fontSize: '0.8rem'}}>{state.errors.initialSceneSummary.join(', ')}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: isSubmitting ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', width: '100%', fontSize: '1rem' }}>
                {isSubmitting ? <><Loader2 className="inline mr-2 h-5 w-5 animate-spin"/>Processing...</> : 'Create Story'}
              </button>
            </form>
        </div>
      </main>
    </div>
  );
}
