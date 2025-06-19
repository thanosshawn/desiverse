// src/app/admin/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { addCharacter, getAdminCredentials, getAllCharacters, updateCharacter } from '@/lib/firebase/rtdb'; // Added updateCharacter
import type { CharacterMetadata } from '@/lib/types';
import type { CharacterCreationAdminFormValues } from '@/lib/types';
import { ref, get } from 'firebase/database'; 
import { db } from '@/lib/firebase/config'; 


export interface CreateCharacterActionState {
  message: string;
  characterId?: string;
  success: boolean;
  errors?: Partial<Record<keyof CharacterCreationAdminFormValues, string[]>> | null;
}

export async function createCharacterAction(
  prevState: CreateCharacterActionState,
  formData: FormData
): Promise<CreateCharacterActionState> {
  
  const data: CharacterCreationAdminFormValues = {
    name: formData.get('name') as string || 'Unnamed Character',
    description: formData.get('description') as string || 'No description provided.',
    personalitySnippet: formData.get('personalitySnippet') as string || 'A mysterious AI.',
    avatarUrl: formData.get('avatarUrl') as string || 'https://placehold.co/400x400.png',
    backgroundImageUrl: formData.get('backgroundImageUrl') as string || '', 
    basePrompt: formData.get('basePrompt') as string || 'You are a helpful AI.',
    styleTags: formData.get('styleTags') as string || 'general',
    defaultVoiceTone: formData.get('defaultVoiceTone') as string || 'neutral',
    dataAiHint: formData.get('dataAiHint') as string || (formData.get('name') as string || 'AI').toLowerCase().split(' ')[0] || 'person',
    messageBubbleStyle: formData.get('messageBubbleStyle') as string || '',
    animatedEmojiResponse: formData.get('animatedEmojiResponse') as string || '',
    audioGreetingUrl: formData.get('audioGreetingUrl') as string || '',
    isPremium: formData.get('isPremium') === 'on' || false,
  };

  if (!data.name.trim()) {
     data.name = `AI_Character_${uuidv4().substring(0,4)}`;
  }

  const characterId = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${uuidv4().substring(0, 4)}`;

  const characterMetadata: Omit<CharacterMetadata, 'id' | 'createdAt'> & { createdAt?: number } = {
    name: data.name,
    description: data.description,
    personalitySnippet: data.personalitySnippet,
    avatarUrl: data.avatarUrl,
    backgroundImageUrl: data.backgroundImageUrl || null,
    basePrompt: data.basePrompt,
    styleTags: data.styleTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    defaultVoiceTone: data.defaultVoiceTone,
    dataAiHint: data.dataAiHint,
    messageBubbleStyle: data.messageBubbleStyle || null,
    animatedEmojiResponse: data.animatedEmojiResponse || null,
    audioGreetingUrl: data.audioGreetingUrl || null,
    isPremium: data.isPremium || false,
  };

  try {
    await addCharacter(characterId, characterMetadata);
    return {
      message: `Character "${data.name}" created successfully with ID: ${characterId}`,
      characterId,
      success: true,
      errors: null,
    };
  } catch (error) {
    console.error('Error creating character:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      message: `Failed to create character: ${errorMessage}`,
      success: false,
      errors: null,
    };
  }
}

export interface UpdateCharacterActionState {
  message: string;
  success: boolean;
  errors?: Partial<Record<keyof CharacterCreationAdminFormValues, string[]>> | null;
}

export async function updateCharacterAction(
  characterId: string, // This will be bound to the action
  prevState: UpdateCharacterActionState,
  formData: FormData
): Promise<UpdateCharacterActionState> {
  
  const data: CharacterCreationAdminFormValues = {
    name: formData.get('name') as string || 'Unnamed Character',
    description: formData.get('description') as string || 'No description provided.',
    personalitySnippet: formData.get('personalitySnippet') as string || 'A mysterious AI.',
    avatarUrl: formData.get('avatarUrl') as string || 'https://placehold.co/400x400.png',
    backgroundImageUrl: formData.get('backgroundImageUrl') as string || '',
    basePrompt: formData.get('basePrompt') as string || 'You are a helpful AI.',
    styleTags: formData.get('styleTags') as string || 'general',
    defaultVoiceTone: formData.get('defaultVoiceTone') as string || 'neutral',
    dataAiHint: formData.get('dataAiHint') as string || (formData.get('name') as string || 'AI').toLowerCase().split(' ')[0] || 'person',
    messageBubbleStyle: formData.get('messageBubbleStyle') as string || '',
    animatedEmojiResponse: formData.get('animatedEmojiResponse') as string || '',
    audioGreetingUrl: formData.get('audioGreetingUrl') as string || '',
    isPremium: formData.get('isPremium') === 'on' || false,
  };

  if (!data.name.trim()) {
     // Should not happen if form is pre-filled, but as a fallback
     return {
        message: 'Character name cannot be empty.',
        success: false,
        errors: { name: ['Character name is required.'] }
     }
  }

  // Note: We don't regenerate characterId on update. It remains stable.
  // The 'id' and 'createdAt' fields are not directly updated via this form for CharacterMetadata.
  const characterUpdateData: Partial<Omit<CharacterMetadata, 'id' | 'createdAt'>> = {
    name: data.name,
    description: data.description,
    personalitySnippet: data.personalitySnippet,
    avatarUrl: data.avatarUrl,
    backgroundImageUrl: data.backgroundImageUrl || null,
    basePrompt: data.basePrompt,
    styleTags: data.styleTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    defaultVoiceTone: data.defaultVoiceTone,
    dataAiHint: data.dataAiHint,
    messageBubbleStyle: data.messageBubbleStyle || null,
    animatedEmojiResponse: data.animatedEmojiResponse || null,
    audioGreetingUrl: data.audioGreetingUrl || null,
    isPremium: data.isPremium || false,
  };

  try {
    await updateCharacter(characterId, characterUpdateData);
    return {
      message: `Character "${data.name}" updated successfully.`,
      success: true,
      errors: null,
    };
  } catch (error) {
    console.error('Error updating character:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      message: `Failed to update character: ${errorMessage}`,
      success: false,
      errors: null,
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
      }))
      .sort((a, b) => b.count - a.count); // Sort by most used

    return stats;
  } catch (error) {
    console.error("Error fetching character usage stats:", error);
    return []; // Return empty array on error
  }
}
