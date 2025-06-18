// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          // Create new user profile if it doesn't exist (e.g. first login)
          const newUserProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName,
            avatarUrl: currentUser.photoURL,
            joinedAt: serverTimestamp() as any, // Will be converted by Firestore
            lastActive: serverTimestamp() as any,
            subscriptionTier: 'free',
          };
          await setDoc(userDocRef, newUserProfile, { merge: true });
          setUserProfile(newUserProfile);
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
      // onAuthStateChanged will handle profile creation/loading
      toast({ title: 'Successfully signed in with Google!' });
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({ title: 'Google Sign-In Error', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
      // onAuthStateChanged will handle profile creation/loading for anonymous user
      toast({ title: 'Signed in anonymously.' });
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      toast({ title: 'Anonymous Sign-In Error', description: error.message, variant: 'destructive' });
      setLoading(false);
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
  
  // Update lastActive on user activity - could be debounced or on specific actions
  useEffect(() => {
    const updateUserLastActive = async () => {
      if (user?.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          await setDoc(userDocRef, { lastActive: serverTimestamp() }, { merge: true });
        } catch (error) {
          console.warn('Failed to update lastActive:', error);
        }
      }
    };

    // Example: update on visibility change
    document.addEventListener('visibilitychange', updateUserLastActive);
    // And maybe on important actions within the app

    return () => {
      document.removeEventListener('visibilitychange', updateUserLastActive);
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
