
// src/app/admin/login/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
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
import { seedAdminCredentialsIfNeeded } from '@/lib/firebase/rtdb'; 
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

function LoginFormComponent() {
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

    const result = await loginAdminAction(initialState, formData);
    setFormState(result);
    setIsLoading(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-pink-50 to-yellow-50">
      <Header/>
      <main className="flex-grow container mx-auto px-4 pt-20 md:pt-22 pb-8 flex items-center justify-center">
        <Card className="w-full max-w-md bg-card/90 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">Admin Login</CardTitle>
            <CardDescription>Enter admin credentials to access character management.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <CardContent className="space-y-4 p-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} className="!rounded-lg"/>
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
                        <Input type="password" placeholder="admin" {...field} className="!rounded-lg"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="p-6">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 !rounded-xl text-lg py-3" disabled={isLoading}>
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

export default function AdminLoginPage() {
  const SuspenseFallback = (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center">
      <Header />
      <Loader2 className="h-12 w-12 animate-spin text-primary mt-4" />
      <p className="text-lg mt-2 text-muted-foreground">Loading admin login...</p>
    </div>
  );

  return (
    <Suspense fallback={SuspenseFallback}>
      <LoginFormComponent />
    </Suspense>
  );
}
