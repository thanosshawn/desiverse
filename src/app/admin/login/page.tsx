// src/app/admin/login/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { loginAdminAction, type LoginAdminActionState } from '../actions';
import { seedAdminCredentialsIfNeeded } from '@/lib/firebase/rtdb'; // To seed credentials
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';

const loginFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const initialState: LoginAdminActionState = {
  success: false,
  message: '',
  errors: null,
};

export default function AdminLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState(initialState);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    // Attempt to seed admin credentials if they don't exist.
    // This is for prototype convenience. In production, this would be a one-time setup.
    const seedCreds = async () => {
      try {
        await seedAdminCredentialsIfNeeded();
      } catch (error) {
        console.warn('Could not seed admin credentials (this might be normal if they already exist or rules prevent it):', error);
      }
    };
    seedCreds();
  }, []);
  
  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? 'Success!' : 'Login Failed',
        description: formState.message,
        variant: formState.success ? 'default' : 'destructive',
      });
      if (formState.success) {
        localStorage.setItem('isAdminLoggedIn', 'true');
        router.push('/admin/create-character');
      }
    }
     if (formState.errors) {
        (Object.keys(formState.errors) as Array<keyof LoginFormValues>).forEach((key) => {
             if (formState.errors && formState.errors[key] && formState.errors[key]?.[0]) {
                 form.setError(key, { type: 'server', message: formState.errors[key]?.[0] });
            }
        });
    }
  }, [formState, toast, router, form]);


  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);

    // We'll call server action directly. useFormState is another option.
    const result = await loginAdminAction(initialState, formData);
    setFormState(result);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
        <Header/>
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
            <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
                <CardDescription>Enter admin credentials to access character management.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <CardContent className="space-y-4">
                    <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="admin" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="admin" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
                    </Button>
                </CardFooter>
                </form>
            </Form>
            </Card>
        </main>
    </div>
  );
}
