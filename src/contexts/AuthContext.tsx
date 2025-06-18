// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { auth, db as rtdb } from '@/lib/firebase/config'; // RTDB instance
import { ref, serverTimestamp as rtdbServerTimestamp, get, set, update } from 'firebase/database'; // RTDB specific imports
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile, getUserProfile, updateUserProfile } from '@/lib/firebase/rtdb'; // Import RTDB functions

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        let existingProfile = await getUserProfile(currentUser.uid);
        if (existingProfile) {
          setUserProfile(existingProfile);
          // Optionally update lastActive here or rely on the dedicated effect
          if (auth.currentUser) { // ensure user is still current
             updateUserProfile(auth.currentUser.uid, { lastActive: rtdbServerTimestamp as unknown as number });
          }
        } else {
          // Create new user profile if it doesn't exist
          const newUserProfileData: Partial<UserProfile> = {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName,
            avatarUrl: currentUser.photoURL,
            joinedAt: rtdbServerTimestamp as unknown as number, // RTDB server timestamp
            lastActive: rtdbServerTimestamp as unknown as number,
            subscriptionTier: 'free',
          };
          await createUserProfile(currentUser.uid, newUserProfileData);
          // Fetch the profile again to get server-resolved timestamps (or construct client-side if complex)
           setUserProfile({
             ...newUserProfileData,
             joinedAt: Date.now(), // Approximate with client time for immediate UI
             lastActive: Date.now(),
           } as UserProfile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Successfully signed in with Google!' });
      // onAuthStateChanged will handle profile creation/loading
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({ title: 'Google Sign-In Error', description: error.message, variant: 'destructive' });
      setLoading(false); // Ensure loading is false on error
    }
  };

  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
      toast({ title: 'Signed in anonymously.' });
      // onAuthStateChanged will handle profile creation/loading
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      toast({ title: 'Anonymous Sign-In Error', description: error.message, variant: 'destructive' });
      setLoading(false); // Ensure loading is false on error
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      toast({ title: 'Signed out successfully.' });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({ title: 'Sign-Out Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const updateUserLastActiveInterval = async () => {
      if (user?.uid) {
        try {
          // Use updateUserProfile to ensure lastActive is updated correctly
          await updateUserProfile(user.uid, { lastActive: rtdbServerTimestamp as unknown as number });
        } catch (error) {
          console.warn('Failed to update lastActive in interval:', error);
        }
      }
    };

    // Update lastActive periodically and on visibility change
    const intervalId = setInterval(updateUserLastActiveInterval, 5 * 60 * 1000); // Every 5 minutes
    document.addEventListener('visibilitychange', updateUserLastActiveInterval);
    
    // Initial update on load if user is present
    if (user?.uid) {
        updateUserLastActiveInterval();
    }

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', updateUserLastActiveInterval);
    };
  }, [user?.uid]);


  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signInAnonymously, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
