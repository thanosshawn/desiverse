// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // RTDB instance
import { serverTimestamp as rtdbServerTimestamp } from 'firebase/database'; // RTDB specific imports
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

// Define a type for the data structure when writing a new user profile,
// where timestamp fields are Firebase ServerValue.TIMESTAMP objects.
type NewUserProfileWritePayload = Omit<Partial<UserProfile>, 'uid' | 'joinedAt' | 'lastActive'> & {
  joinedAt: object; // Firebase Server Timestamp Placeholder
  lastActive: object; // Firebase Server Timestamp Placeholder
};


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
          if (auth.currentUser) { 
             updateUserProfile(auth.currentUser.uid, { lastActive: rtdbServerTimestamp() }); // Call rtdbServerTimestamp()
          }
        } else {
          const newUserProfileData: NewUserProfileWritePayload = {
            email: currentUser.email,
            name: currentUser.displayName,
            avatarUrl: currentUser.photoURL,
            joinedAt: rtdbServerTimestamp(), // CALL the function here
            lastActive: rtdbServerTimestamp(), // CALL the function here
            subscriptionTier: 'free',
            // selectedTheme and languagePreference will be set to defaults by createUserProfile
          };
          await createUserProfile(currentUser.uid, newUserProfileData);
          
           // Optimistic update for UI (timestamps become numbers here)
           setUserProfile({
             uid: currentUser.uid, // Make sure uid is included
             email: newUserProfileData.email || undefined,
             name: newUserProfileData.name || undefined,
             avatarUrl: newUserProfileData.avatarUrl || undefined,
             joinedAt: Date.now(), 
             lastActive: Date.now(),
             subscriptionTier: newUserProfileData.subscriptionTier || 'free',
             selectedTheme: 'light', 
             languagePreference: 'hinglish', 
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
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({ title: 'Google Sign-In Error', description: error.message, variant: 'destructive' });
    } finally {
        setLoading(false); // Ensure loading is false even if onAuthStateChanged handles it later
    }
  };

  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
      toast({ title: 'Signed in anonymously.' });
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      toast({ title: 'Anonymous Sign-In Error', description: error.message, variant: 'destructive' });
    } finally {
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
  
  useEffect(() => {
    const updateUserLastActiveInterval = async () => {
      if (user?.uid) {
        try {
          await updateUserProfile(user.uid, { lastActive: rtdbServerTimestamp() }); // Call rtdbServerTimestamp()
        } catch (error) {
          console.warn('Failed to update lastActive in interval:', error);
        }
      }
    };

    const intervalId = setInterval(updateUserLastActiveInterval, 5 * 60 * 1000); 
    document.addEventListener('visibilitychange', updateUserLastActiveInterval);
    
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
