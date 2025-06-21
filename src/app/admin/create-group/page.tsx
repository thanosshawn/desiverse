
// src/app/admin/create-group/page.tsx
'use client';

import React, { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createGroupChatAction, type CreateGroupChatActionState } from '../actions';
import type { GroupChatAdminFormValues, CharacterMetadata } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { uploadCharacterAsset } from '@/lib/supabase/client';
import { Loader2, LogOut, ListChecks, BookOpenCheck, BarChart3, PlusCircle, FileText, Users, MessageSquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { getAllCharacters } from '@/lib/firebase/rtdb';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const initialState: CreateGroupChatActionState = {
  message: '',
  success: false,
  errors: null,
};

const defaultFormValues: Omit<GroupChatAdminFormValues, 'characterIds'> = {
  title: '',
  description: '',
  coverImageUrl: 'https://placehold.co/800x450.png',
};

export default function CreateGroupChatPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm({
    defaultValues: defaultFormValues,
  });

  const [state, formAction, isPending] = useActionState(createGroupChatAction, initialState);
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
        } catch (error) {
          toast({ title: 'Error', description: 'Could not load characters.', variant: 'destructive' });
        } finally {
          setLoadingCharacters(false);
        }
      };
      fetchChars();
    }
  }, [isAdminLoggedIn, toast]);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Error Creating Group',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        form.reset(defaultFormValues);
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="characterIds"]');
        checkboxes.forEach(cb => cb.checked = false);
      }
    }
  }, [state, toast, form]);

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
                    <MessageSquarePlus className="mr-2 h-6 w-6" /> Create New Group Chat
                </h1>
                <p className="text-sm">Set up a new public room for users to chat together.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-6 justify-center md:justify-start">
              <Link href="/admin/manage-groups" passHref><Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4"/>Manage Groups</Button></Link>
              <Link href="/admin/create-character" passHref><Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Create Char</Button></Link>
              <Link href="/admin/manage-characters" passHref><Button variant="outline" size="sm"><ListChecks className="mr-2 h-4 w-4" />Manage Chars</Button></Link>
              <Link href="/admin/create-story" passHref><Button variant="outline" size="sm"><BookOpenCheck className="mr-2 h-4 w-4"/>Create Story</Button></Link>
              <Link href="/admin/manage-stories" passHref><Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4"/>Manage Stories</Button></Link>
              <Link href="/admin/analytics" passHref><Button variant="outline" size="sm"><BarChart3 className="mr-2 h-4 w-4" />Analytics</Button></Link>
              <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
            </div>

            <form action={formAction} className="space-y-4" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
              {state.message && !state.success && (
                <p style={{ color: 'red' }}>{state.message}</p>
              )}

              <div>
                <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Group Title</label>
                <input type="text" id="title" {...form.register("title")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                {state.errors?.title && <p style={{color: 'red', fontSize: '0.8rem'}}>{state.errors.title.join(', ')}</p>}
              </div>

              <div>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Group Description</label>
                <textarea id="description" {...form.register("description")} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} rows={3}></textarea>
              </div>

              <div>
                <label htmlFor="characterIds" style={{ display: 'block', marginBottom: '10px' }}>Host AI Characters</label>
                <div className="space-y-2 p-3 border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                    {characters.length > 0 ? characters.map(char => (
                        <div key={char.id} className="flex items-center space-x-3">
                           <Checkbox
                                id={`char-cb-${char.id}`}
                                name="characterIds"
                                value={char.id}
                            />
                            <Label htmlFor={`char-cb-${char.id}`} className="font-normal cursor-pointer flex-grow">{char.name}</Label>
                        </div>
                    )) : <p className="text-sm text-gray-500">No characters found.</p>}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Select one or more AI characters to host the group chat.</p>
                {state.errors?.characterIds && <p style={{color: 'red', fontSize: '0.8rem'}}>{state.errors.characterIds.join(', ')}</p>}
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
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Image for the group card. (e.g., https://placehold.co/800x450.png).</p>
              </div>

              <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: isSubmitting ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', width: '100%', fontSize: '1rem' }}>
                {isSubmitting ? <><Loader2 className="inline mr-2 h-5 w-5 animate-spin"/>Processing...</> : 'Create Group Chat'}
              </button>
            </form>
        </div>
      </main>
    </div>
  );
}
