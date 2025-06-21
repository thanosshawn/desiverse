
// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config'; 
import { serverTimestamp as rtdbServerTimestamp, ref, set } from 'firebase/database'; 
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
  createUserProfile, 
  getUserProfile, 
  updateUserProfile,
  setOnlineStatus,
  goOfflineOnDisconnect,
  setOfflineStatus,
  incrementTotalRegisteredUsers
} from '@/lib/firebase/rtdb'; 
import { useTheme } from 'next-themes'; 

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type NewUserProfileWritePayload = Omit<Partial<UserProfile>, 'uid' | 'joinedAt' | 'lastActive'> & {
  joinedAt: object; 
  lastActive: object; 
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { setTheme } = useTheme(); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        let existingProfile = await getUserProfile(currentUser.uid);
        if (existingProfile) {
          setUserProfile(existingProfile);
          await updateUserProfile(currentUser.uid, { lastActive: rtdbServerTimestamp() });
          if (existingProfile.selectedTheme) { 
            setTheme(existingProfile.selectedTheme);
          }
        } else {
          const defaultUserTheme = 'light'; 
          const newUserProfileData: NewUserProfileWritePayload = {
            email: currentUser.email,
            name: currentUser.displayName,
            avatarUrl: currentUser.photoURL,
            joinedAt: rtdbServerTimestamp(), 
            lastActive: rtdbServerTimestamp(), 
            subscriptionTier: 'free',
            selectedTheme: defaultUserTheme, 
            languagePreference: 'hinglish',
          };
          await createUserProfile(currentUser.uid, newUserProfileData);
          
           setUserProfile({
             uid: currentUser.uid, 
             email: newUserProfileData.email || undefined,
             name: newUserProfileData.name || undefined,
             avatarUrl: newUserProfileData.avatarUrl || undefined,
             joinedAt: Date.now(), 
             lastActive: Date.now(),
             subscriptionTier: newUserProfileData.subscriptionTier || 'free',
             selectedTheme: newUserProfileData.selectedTheme || defaultUserTheme, 
             languagePreference: newUserProfileData.languagePreference || 'hinglish', 
           } as UserProfile);
           setTheme(defaultUserTheme); 
        }
        await setOnlineStatus(currentUser.uid, currentUser.displayName || (existingProfile?.name || 'Anonymous'));
        goOfflineOnDisconnect(currentUser.uid);

      } else {
        if (user?.uid) {
          await setOfflineStatus(user.uid);
        }
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, setTheme]); 

  const signInWithGoogle = async () => {
    setLoading(true); 
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Checking your Google account...' });
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
      toast({ title: 'Signing you in anonymously...' });
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      toast({ title: 'Anonymous Sign-In Error', description: error.message, variant: 'destructive' });
      setLoading(false); 
    }
  };

  const signOut = async () => {
    if (user) { 
      await setOfflineStatus(user.uid); 
    }
    setLoading(true); 
    try {
      await firebaseSignOut(auth);
      toast({ title: 'Signing you out...' });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({ title: 'Sign-Out Error', description: error.message, variant: 'destructive' });
      setLoading(false); 
    }
  };
  
  useEffect(() => {
    const updateUserLastActiveInterval = async () => {
      if (user?.uid) {
        try {
          await updateUserProfile(user.uid, { lastActive: rtdbServerTimestamp() }); 
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
