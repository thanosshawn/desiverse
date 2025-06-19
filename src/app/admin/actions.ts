// src/app/admin/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { addCharacter, getAdminCredentials, getAllCharacters } from '@/lib/firebase/rtdb'; // Added getAllCharacters
import type { CharacterMetadata } from '@/lib/types';
// Zod schema for validation is removed from this action
import type { CharacterCreationAdminFormValues } from '@/lib/types';
import { ref, get } from 'firebase/database'; // Added for RTDB access
import { db } from '@/lib/firebase/config'; // Added for RTDB instance


export interface CreateCharacterActionState {
  message: string;
  characterId?: string;
  success: boolean;
  errors?: Partial<Record<keyof CharacterCreationAdminFormValues, string[]>> | null; // Kept for structure, but less used
}

export async function createCharacterAction(
  prevState: CreateCharacterActionState,
  formData: FormData
): Promise<CreateCharacterActionState> {
  
  // Directly extract data from formData since Zod validation is removed for this form
  const data: CharacterCreationAdminFormValues = {
    name: formData.get('name') as string || 'Unnamed Character',
    description: formData.get('description') as string || 'No description provided.',
    personalitySnippet: formData.get('personalitySnippet') as string || 'A mysterious AI.',
    avatarUrl: formData.get('avatarUrl') as string || 'https://placehold.co/400x400.png',
    backgroundImageUrl: formData.get('backgroundImageUrl') as string || '', // Default to empty string if not present
    basePrompt: formData.get('basePrompt') as string || 'You are a helpful AI.',
    styleTags: formData.get('styleTags') as string || 'general',
    defaultVoiceTone: formData.get('defaultVoiceTone') as string || 'neutral',
    dataAiHint: formData.get('dataAiHint') as string || (formData.get('name') as string || 'AI').toLowerCase().split(' ')[0] || 'person',
    messageBubbleStyle: formData.get('messageBubbleStyle') as string || '',
    animatedEmojiResponse: formData.get('animatedEmojiResponse') as string || '',
    audioGreetingUrl: formData.get('audioGreetingUrl') as string || '',
    isPremium: formData.get('isPremium') === 'on' || false,
  };

  // Basic check if name is provided, fallback if not (though autofill should handle this)
  if (!data.name.trim()) {
     data.name = `AI_Character_${uuidv4().substring(0,4)}`;
  }

  const characterId = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${uuidv4().substring(0, 4)}`;

  const characterMetadata: Omit<CharacterMetadata, 'id' | 'createdAt'> & { createdAt?: number } = {
    name: data.name,
    description: data.description,
    personalitySnippet: data.personalitySnippet,
    avatarUrl: data.avatarUrl,
    backgroundImageUrl: data.backgroundImageUrl || null, // Convert empty string to null
    basePrompt: data.basePrompt,
    styleTags: data.styleTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    defaultVoiceTone: data.defaultVoiceTone,
    dataAiHint: data.dataAiHint,
    messageBubbleStyle: data.messageBubbleStyle || null, // Convert empty string to null
    animatedEmojiResponse: data.animatedEmojiResponse || null, // Convert empty string to null
    audioGreetingUrl: data.audioGreetingUrl || null, // Convert empty string to null
    isPremium: data.isPremium || false,
  };

  try {
    await addCharacter(characterId, characterMetadata);
    return {
      message: `Character "${data.name}" created successfully with ID: ${characterId}`,
      characterId,
      success: true,
      errors: null, // Validation errors are no longer generated here
    };
  } catch (error) {
    console.error('Error creating character:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      message: `Failed to create character: ${errorMessage}`,
      success: false,
      errors: null, // No field-specific validation errors
    };
  }
}


// --- Admin Login Action ---
const loginFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export interface LoginAdminActionState {
  success: boolean;
  message: string;
  errors?: Partial<Record<'username' | 'password', string[]>> | null;
}

export async function loginAdminAction(
  prevState: LoginAdminActionState,
  formData: FormData
): Promise<LoginAdminActionState> {
  const rawFormData = {
    username: formData.get('username') as string,
    password: formData.get('password') as string,
  };

  const validatedFields = loginFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
     const fieldErrors: Partial<Record<'username' | 'password', string[]>> = {};
     for (const issue of validatedFields.error.issues) {
        const path = issue.path[0] as 'username' | 'password';
        if (!fieldErrors[path]) {
            fieldErrors[path] = [];
        }
        fieldErrors[path]?.push(issue.message);
    }
    return {
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: fieldErrors,
    };
  }

  const { username, password } = validatedFields.data;

  try {
    const adminCreds = await getAdminCredentials();
    
    if (!adminCreds) {
      return {
        success: false,
        message: 'Admin credentials not found in database. Please ensure they are seeded.',
        errors: null,
      };
    }

    // WARNING: Comparing plain text passwords. Insecure for production.
    if (username === adminCreds.username && password === adminCreds.password) {
      return {
        success: true,
        message: 'Login successful!',
        errors: null,
      };
    } else {
      return {
        success: false,
        message: 'Invalid username or password.',
        errors: null,
      };
    }
  } catch (error) {
    console.error('Error during admin login:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      success: false,
      message: `Login failed: ${errorMessage}`,
      errors: null,
    };
  }
}

// --- Character Usage Stats Action ---
export interface CharacterUsageStat {
  name: string;
  count: number;
  fill?: string; // For chart color, optional
}

export async function getCharacterUsageStats(): Promise<CharacterUsageStat[]> {
  try {
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    const characterCounts: Record<string, number> = {};

    if (usersSnapshot.exists()) {
      usersSnapshot.forEach(userSnap => {
        // Check if userChats exists before trying to access its children
        if (userSnap.hasChild('userChats')) {
          const userChats = userSnap.child('userChats').val();
          if (userChats) {
            Object.keys(userChats).forEach(characterId => {
              // Ensure characterId is a valid key (not a prototype property)
              if (Object.prototype.hasOwnProperty.call(userChats, characterId)) {
                characterCounts[characterId] = (characterCounts[characterId] || 0) + 1;
              }
            });
          }
        }
      });
    }

    const allCharacters = await getAllCharacters(); // Assumes this function correctly fetches all characters
    
    const stats = allCharacters
      .map(char => ({
        name: char.name,
        count: characterCounts[char.id] || 0,
        // Example: could assign different fill colors based on character or count
        // fill: char.name === 'Riya' ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))', 
      }))
      .sort((a, b) => b.count - a.count); // Sort by most used

    return stats;
  } catch (error) {
    console.error("Error fetching character usage stats:", error);
    return []; // Return empty array on error
  }
}
