// src/app/admin/manage-characters/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getAllCharacters } from '@/lib/firebase/rtdb';
import type { CharacterMetadata } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, Edit, Trash2, PlusCircle, Eye, BarChart3, BookOpenCheck, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCharacterAction } from '../actions';

export default function ManageCharactersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<CharacterMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
    if (isAdminLoggedIn && authStatusChecked) {
      const fetchCharacters = async () => {
        setIsLoading(true);
        try {
          const fetchedCharacters = await getAllCharacters();
          setCharacters(fetchedCharacters);
        } catch (error) {
          console.error("Error fetching characters:", error);
          toast({ title: 'Error', description: 'Could not load characters.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchCharacters();
    } else if (authStatusChecked && !isAdminLoggedIn) {
        setIsLoading(false);
    }
  }, [isAdminLoggedIn, authStatusChecked, toast]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    toast({ title: 'Logged Out', description: 'You have been logged out as admin.' });
    router.replace('/admin/login');
  };

  const handleDeleteCharacter = async (characterId: string, characterName: string) => {
    setIsDeleting(characterId);
    const result = await deleteCharacterAction(characterId);
    if (result.success) {
      toast({
        title: 'Character Deleted',
        description: `Character "${characterName}" has been successfully deleted.`,
        variant: 'default',
      });
      setCharacters(prev => prev.filter(char => char.id !== characterId));
    } else {
      toast({
        title: 'Deletion Failed',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsDeleting(null);
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
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8">
        <Card className="max-w-4xl mx-auto bg-card/90 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6">
            <div>
              <CardTitle className="text-2xl font-headline text-primary">Manage AI Characters</CardTitle>
              <CardDescription>View, edit, or delete existing characters.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
               <Link href="/admin/create-character" passHref className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Create new character">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Char
                </Button>
              </Link>
              <Link href="/admin/create-story" passHref className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Create new story">
                    <BookOpenCheck className="mr-2 h-4 w-4" /> Create Story
                </Button>
              </Link>
              <Link href="/admin/manage-stories" passHref className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Manage existing stories">
                      <FileText className="mr-2 h-4 w-4"/> Manage Stories
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
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : characters.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No characters found. Create one to get started!</p>
                 <Link href="/admin/create-character" className="mt-4 inline-block">
                    <Button className="!rounded-xl"><PlusCircle className="mr-2 h-4 w-4" />Create Character</Button>
                 </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Snippet</TableHead>
                    <TableHead className="text-center">Premium</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((char) => (
                    <TableRow key={char.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage src={char.avatarUrl} alt={char.name} />
                          <AvatarFallback className="rounded-md bg-primary/20 text-primary">
                            {char.name.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{char.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{char.personalitySnippet}</TableCell>
                      <TableCell className="text-center">
                        {char.isPremium ? (
                           <Badge variant="default" className="bg-accent text-accent-foreground">Yes</Badge>
                        ) : (
                           <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/chat/${char.id}`} passHref target="_blank">
                           <Button variant="outline" size="icon" title="View Character (Live)" className="hover:text-primary rounded-md">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/edit-character/${char.id}`} passHref>
                          <Button variant="outline" size="icon" title="Edit Character" className="hover:text-primary rounded-md">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Delete Character" 
                              className="hover:text-destructive hover:border-destructive rounded-md"
                              disabled={isDeleting === char.id}
                            >
                              {isDeleting === char.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                character &quot;{char.name}&quot; and all associated data (chats, stories).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="!rounded-lg">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCharacter(char.id, char.name)}
                                className="bg-destructive hover:bg-destructive/90 !rounded-lg"
                                disabled={isDeleting === char.id}
                              >
                                {isDeleting === char.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
