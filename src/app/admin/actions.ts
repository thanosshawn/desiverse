// src/app/admin/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { addCharacter, getAdminCredentials } from '@/lib/firebase/rtdb'; 
import type { CharacterMetadata, CharacterCreationFormSchema } from '@/lib/types';


const characterFormActionSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  personalitySnippet: z.string().min(5).max(100),
  avatarUrl: z.string().url(),
  backgroundImageUrl: z.string().url().optional().or(z.literal('')),
  basePrompt: z.string().min(20),
  styleTags: z.string().min(1), 
  defaultVoiceTone: z.string().min(2),
  dataAiHint: z.string().optional(),
  messageBubbleStyle: z.string().optional(),
  animatedEmojiResponse: z.string().url().optional().or(z.literal('')),
  audioGreetingUrl: z.string().url().optional().or(z.literal('')),
  isPremium: z.preprocess((val) => val === 'on' || val === true, z.boolean().optional()), // Handle FormData 'on' value for checkbox
});


export interface CreateCharacterActionState {
  message: string;
  characterId?: string;
  success: boolean;
  errors?: Partial<Record<keyof CharacterCreationFormSchema, string[]>> | null;
}

export async function createCharacterAction(
  prevState: CreateCharacterActionState,
  formData: FormData
): Promise<CreateCharacterActionState> {
  const rawFormData = Object.fromEntries(formData.entries());
   // Ensure boolean is correctly interpreted from FormData
  if (formData.has('isPremium')) {
    rawFormData.isPremium = formData.get('isPremium') === 'on';
  } else {
    rawFormData.isPremium = false; // Default if not present
  }


  const validatedFields = characterFormActionSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const fieldErrors: Partial<Record<keyof CharacterCreationFormSchema, string[]>> = {};
    for (const issue of validatedFields.error.issues) {
        const path = issue.path[0] as keyof CharacterCreationFormSchema;
        if (!fieldErrors[path]) {
            fieldErrors[path] = [];
        }
        fieldErrors[path]?.push(issue.message);
    }
    return {
      message: 'Validation failed. Please check the form for errors.',
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
