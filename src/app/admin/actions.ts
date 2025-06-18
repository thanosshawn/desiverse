// src/app/admin/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { addCharacter } from '@/lib/firebase/rtdb';
import type { CharacterMetadata, CharacterCreationFormSchema } from '@/lib/types';

const characterFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(500),
  avatarUrl: z.string().url({ message: 'Please enter a valid URL for the avatar.' }),
  backgroundImageUrl: z.string().url({ message: 'Please enter a valid URL for the background.' }).optional().or(z.literal('')),
  basePrompt: z.string().min(20, { message: 'Base prompt must be at least 20 characters.' }),
  styleTags: z.string().min(1, {message: 'Please enter at least one style tag.'}), // Comma-separated
  defaultVoiceTone: z.string().min(2, { message: 'Default voice tone must be at least 2 characters.' }),
  dataAiHint: z.string().optional(),
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
  const rawFormData: CharacterCreationFormSchema = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    avatarUrl: formData.get('avatarUrl') as string,
    backgroundImageUrl: formData.get('backgroundImageUrl') as string || undefined,
    basePrompt: formData.get('basePrompt') as string,
    styleTags: formData.get('styleTags') as string,
    defaultVoiceTone: formData.get('defaultVoiceTone') as string,
    dataAiHint: formData.get('dataAiHint') as string || undefined,
  };

  const validatedFields = characterFormSchema.safeParse(rawFormData);

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

  const characterMetadata: Omit<CharacterMetadata, 'id'> = {
    name: data.name,
    description: data.description,
    avatarUrl: data.avatarUrl,
    backgroundImageUrl: data.backgroundImageUrl || undefined,
    basePrompt: data.basePrompt,
    styleTags: data.styleTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    defaultVoiceTone: data.defaultVoiceTone,
    createdAt: Date.now(),
    dataAiHint: data.dataAiHint || data.name.toLowerCase().split(' ')[0] || 'person',
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
