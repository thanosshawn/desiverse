// src/app/admin/manage-groups/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllGroupChats } from '@/lib/firebase/rtdb';
import type { GroupChatMetadata } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, Edit, Trash2, PlusCircle, FileText, BookOpenCheck, BarChart3, ListChecks, Eye, Users, MessageSquarePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { deleteGroupChatAction } from '../actions';

export default function ManageGroupsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupChatMetadata[]>([]);
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
      const fetchGroups = async () => {
        setIsLoading(true);
        try {
          const fetchedGroups = await getAllGroupChats();
          setGroups(fetchedGroups);
        } catch (error) {
          console.error("Error fetching groups:", error);
          toast({ title: 'Error', description: 'Could not load group chats.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchGroups();
    } else if (authStatusChecked && !isAdminLoggedIn) {
      setIsLoading(false);
    }
  }, [isAdminLoggedIn, authStatusChecked, toast]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    toast({ title: 'Logged Out', description: 'You have been logged out as admin.' });
    router.replace('/admin/login');
  };

  const handleDeleteGroup = async (groupId: string, groupTitle: string) => {
    setIsDeleting(groupId);
    const result = await deleteGroupChatAction(groupId);
    if (result.success) {
      toast({
        title: 'Group Deleted',
        description: `Group "${groupTitle}" has been successfully deleted.`,
      });
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } else {
      toast({
        title: 'Deletion Failed',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsDeleting(null);
  };

  const formatDate = (timestamp: number | object | undefined) => {
    if (typeof timestamp === 'number' && timestamp > 0) {
      try {
        return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
      } catch (e) {
        return "Invalid Date";
      }
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
        <Card className="max-w-4xl mx-auto bg-card shadow-xl rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6">
            <div>
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <Users className="mr-2 h-6 w-6" /> Manage Group Chats
              </CardTitle>
              <CardDescription>View, edit, or delete existing public chat rooms.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 mt-4 sm:mt-0">
               <Link href="/admin/create-group" passHref><Button variant="outline" size="sm" className="!rounded-lg"><MessageSquarePlus className="mr-2 h-4 w-4"/>Create Group</Button></Link>
               <Link href="/admin/create-character" passHref><Button variant="outline" size="sm" className="!rounded-lg"><PlusCircle className="mr-2 h-4 w-4"/>Create Char</Button></Link>
               <Link href="/admin/manage-characters" passHref><Button variant="outline" size="sm" className="!rounded-lg"><ListChecks className="mr-2 h-4 w-4"/>Manage Chars</Button></Link>
               <Link href="/admin/analytics" passHref><Button variant="outline" size="sm" className="!rounded-lg"><BarChart3 className="mr-2 h-4 w-4"/>Analytics</Button></Link>
               <Button variant="outline" size="sm" onClick={handleLogout} className="!rounded-lg"><LogOut className="mr-2 h-4 w-4"/>Logout</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No group chats found. Create one to get started!</p>
                 <Link href="/admin/create-group" className="mt-4 inline-block">
                    <Button className="!rounded-xl"><MessageSquarePlus className="mr-2 h-4 w-4"/>Create Group Chat</Button>
                 </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground flex items-center gap-2">
                        <Avatar className="h-6 w-6 rounded-sm">
                           <AvatarImage src={group.characterAvatarSnapshot} alt={group.characterNameSnapshot} />
                           <AvatarFallback className="rounded-sm bg-primary/20 text-primary text-xs">{group.characterNameSnapshot.substring(0,1)}</AvatarFallback>
                        </Avatar>
                        {group.characterNameSnapshot}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(group.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/groups/${group.id}`} passHref target="_blank">
                           <Button variant="outline" size="icon" title="View Group (Live)" className="hover:text-primary rounded-md"><Eye className="h-4 w-4"/></Button>
                        </Link>
                        <Button variant="outline" size="icon" title="Edit Group (Coming Soon)" className="hover:text-primary rounded-md" disabled><Edit className="h-4 w-4"/></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Delete Group" className="hover:text-destructive hover:border-destructive rounded-md" disabled={isDeleting === group.id}>
                              {isDeleting === group.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the group &quot;{group.title}&quot;. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="!rounded-lg">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteGroup(group.id, group.title)} className="bg-destructive hover:bg-destructive/90 !rounded-lg" disabled={isDeleting === group.id}>
                                {isDeleting === group.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
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
