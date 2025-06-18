// src/app/admin/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { addCharacter, getAdminCredentials } from '@/lib/firebase/rtdb';
import type { CharacterMetadata } from '@/lib/types';
import { characterCreationAdminFormSchema, type CharacterCreationAdminFormValues } from '@/lib/types';


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
  const rawFormData = Object.fromEntries(formData.entries());

  // Preprocess isPremium as Zod schema expects boolean but FormData gives string 'on' or undefined
  if (formData.has('isPremium')) {
    rawFormData.isPremium = formData.get('isPremium') === 'on';
  } else {
    rawFormData.isPremium = false; // Default if not present
  }

  // Use the shared schema for validation
  const validatedFields = characterCreationAdminFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const fieldErrors: Partial<Record<keyof CharacterCreationAdminFormValues, string[]>> = {};
    for (const issue of validatedFields.error.issues) {
        // issue.path is an array, for simple objects, path[0] is the field name
        const path = issue.path[0] as keyof CharacterCreationAdminFormValues;
        if (!fieldErrors[path]) {
            fieldErrors[path] = [];
        }
        fieldErrors[path]?.push(issue.message); // Use the explicit message from the shared schema
    }
    return {
      message: 'Validation failed. Please correct the errors indicated on the form fields below.', // Updated generic message
      success: false,
      errors: fieldErrors,
    };
  }

  const data = validatedFields.data;
  const characterId = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${uuidv4().substring(0, 4)}`;

  const characterMetadata: Omit<CharacterMetadata, 'id' | 'createdAt'> & { createdAt?: number } = {
    name: data.name,
    description: data.description,
    personalitySnippet: data.personalitySnippet,
    avatarUrl: data.avatarUrl,
    backgroundImageUrl: data.backgroundImageUrl || undefined,
    basePrompt: data.basePrompt,
    styleTags: data.styleTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    defaultVoiceTone: data.defaultVoiceTone,
    dataAiHint: data.dataAiHint || data.name.toLowerCase().split(' ')[0] || 'person',
    messageBubbleStyle: data.messageBubbleStyle || undefined,
    animatedEmojiResponse: data.animatedEmojiResponse || undefined,
    audioGreetingUrl: data.audioGreetingUrl || undefined,
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

    
