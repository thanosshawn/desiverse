// src/app/admin/manage-stories/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getAllInteractiveStories } from '@/lib/firebase/rtdb';
import type { InteractiveStory } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, Edit, Trash2, PlusCircle, FileText, BookOpenCheck, BarChart3, ListChecks, Eye } from 'lucide-react';
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
import { formatDistanceToNowStrict } from 'date-fns';

export default function ManageStoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stories, setStories] = useState<InteractiveStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const fetchStories = async () => {
        setIsLoading(true);
        try {
          const fetchedStories = await getAllInteractiveStories();
          // Ensure createdAt is a number for sorting, defaulting if necessary
          fetchedStories.sort((a, b) => (typeof b.createdAt === 'number' ? b.createdAt : 0) - (typeof a.createdAt === 'number' ? a.createdAt : 0));
          setStories(fetchedStories);
        } catch (error) {
          console.error("Error fetching stories:", error);
          toast({ title: 'Error', description: 'Could not load stories.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchStories();
    } else if (authStatusChecked && !isAdminLoggedIn) {
        setIsLoading(false);
    }
  }, [isAdminLoggedIn, authStatusChecked, toast]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    toast({ title: 'Logged Out', description: 'You have been logged out as admin.' });
    router.replace('/admin/login');
  };

  const handleDeleteStory = async (storyId: string, storyTitle: string) => {
    toast({
      title: `Deletion Action (Simulated for ${storyTitle})`,
      description: `If fully implemented, this would delete '${storyTitle}' (ID: ${storyId}) from the database. This is a placeholder action.`,
      variant: 'default',
      duration: 5000,
    });
    console.log(`TODO: Implement RTDB delete for story ID: ${storyId}, Title: ${storyTitle}`);
    // To visually remove, you might re-fetch or filter the list:
    // setStories(prev => prev.filter(s => s.id !== storyId));
  };
  
  const formatDate = (timestamp: number | object | undefined) => {
    if (typeof timestamp === 'number') {
      return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
    }
    return 'N/A';
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
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <FileText className="mr-2 h-6 w-6" /> Manage Interactive Stories
              </CardTitle>
              <CardDescription>View, edit, or delete existing stories.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
               <Link href="/admin/create-story" passHref className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Create new story">
                  <BookOpenCheck className="mr-2 h-4 w-4" /> Create Story
                </Button>
              </Link>
               <Link href="/admin/create-character" passHref className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Create new character">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Char
                </Button>
              </Link>
               <Link href="/admin/manage-characters" passHref className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Manage Characters">
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
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No stories found. Create one to get started!</p>
                 <Link href="/admin/create-story" className="mt-4 inline-block">
                    <Button className="!rounded-xl"><BookOpenCheck className="mr-2 h-4 w-4" />Create Story</Button>
                 </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Cover</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Protagonist</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-center">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stories.map((story) => (
                    <TableRow key={story.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10 rounded-md">
                           {story.coverImageUrl ? (
                            <AvatarImage src={story.coverImageUrl} alt={story.title} />
                           ) : (
                            <AvatarImage src={story.characterAvatarSnapshot} alt={story.characterNameSnapshot} />
                           )}
                          <AvatarFallback className="rounded-md bg-primary/20 text-primary">
                            {story.title.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{story.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{story.characterNameSnapshot}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {story.tags.map(tag => <Badge key={tag} variant="secondary" className="mr-1 mb-1 text-xs">{tag}</Badge>)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">{formatDate(story.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/story/${story.id}`} passHref target="_blank">
                           <Button variant="outline" size="icon" title="View Story (Live)" className="hover:text-primary rounded-md">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="icon" title="Edit Story (Placeholder)" className="hover:text-primary rounded-md" onClick={() => toast({title: "Edit Story (Coming Soon!)", description: "This feature will be available in a future update.", duration: 3000 })}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Delete Story" className="hover:text-destructive hover:border-destructive rounded-md">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                story &quot;{story.title}&quot;. (Deletion is simulated in this prototype)
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="!rounded-lg">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStory(story.id, story.title)}
                                className="bg-destructive hover:bg-destructive/90 !rounded-lg"
                              >
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
