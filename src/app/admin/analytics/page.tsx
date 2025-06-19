// src/app/admin/analytics/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, BarChart3, AlertTriangle, Palette, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getCharacterUsageStats, type CharacterUsageStat } from '../actions';
import { useTheme } from 'next-themes';

export default function AnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [characterUsage, setCharacterUsage] = useState<CharacterUsageStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [authStatusChecked, setAuthStatusChecked] = useState(false);
  const { theme } = useTheme(); // For chart colors

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
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const stats = await getCharacterUsageStats();
          // Assign colors dynamically for the chart
          const chartColors = [
            'hsl(var(--chart-1))', 
            'hsl(var(--chart-2))', 
            'hsl(var(--chart-3))', 
            'hsl(var(--chart-4))', 
            'hsl(var(--chart-5))'
          ];
          const statsWithColors = stats.map((stat, index) => ({
            ...stat,
            fill: chartColors[index % chartColors.length],
          }));
          setCharacterUsage(statsWithColors);
        } catch (error) {
          console.error("Error fetching analytics data:", error);
          toast({ title: 'Error Loading Analytics', description: 'Could not load character usage data.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else if (authStatusChecked && !isAdminLoggedIn) {
        setIsLoading(false);
    }
  }, [isAdminLoggedIn, authStatusChecked, toast]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    toast({ title: 'Logged Out', description: 'You have been logged out as admin.' });
    router.replace('/admin/login');
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border text-sm">
          <p className="font-semibold text-foreground">{`${label}`}</p>
          <p className="text-primary">{`Chat Sessions: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
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
          <CardHeader className="flex flex-row justify-between items-center p-6">
            <div>
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <BarChart3 className="mr-2 h-6 w-6" /> Admin Analytics
              </CardTitle>
              <CardDescription>Overview of application usage and engagement.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Link href="/admin/create-character" passHref className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Create new character">
                      Create
                  </Button>
              </Link>
              <Link href="/admin/manage-characters" passHref className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="!rounded-lg w-full" title="Manage existing characters">
                      Manage
                  </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="!rounded-lg w-full sm:w-auto" title="Logout from admin">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <section>
              <h3 className="text-xl font-semibold text-primary/90 mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5 text-accent"/> Character Popularity
              </h3>
              {isLoading ? (
                <div className="flex justify-center items-center py-10 h-72">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : characterUsage.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground h-72 flex flex-col justify-center items-center">
                   <AlertTriangle className="h-10 w-10 text-amber-500 mb-3"/>
                  No character usage data available yet. Start some chats!
                </div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={characterUsage} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        interval={0} 
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent)/0.1)' }}/>
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Note: Character usage is based on the number of unique user-character chat sessions initiated. 
                The current data aggregation method might be slow for very large numbers of users.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-primary/90 mb-4 flex items-center">
                <Palette className="mr-2 h-5 w-5 text-accent"/> Tone Usage (Future)
              </h3>
              <p className="text-muted-foreground">
                Tracking engagement by character tone is a planned feature. This would require users to select or be assigned different tones during chat sessions.
              </p>
            </section>

             <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 p-4 rounded-lg">
                <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-lg text-amber-700 dark:text-amber-300 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2"/>Advanced Analytics (Coming Soon)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 text-sm text-amber-600 dark:text-amber-400 space-y-1">
                    <p>Features like Choice Heatmaps, Prompt A/B Testing, and detailed Gemini Flow Analytics (runtime, quality, token usage) require more advanced data tracking and are planned for future updates.</p>
                    <p>For Genkit flow inspection, you can use the Genkit Developer UI by running: <code>npm run genkit:dev</code></p>
                </CardContent>
            </Card>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
