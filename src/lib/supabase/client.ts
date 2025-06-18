
// src/lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is not configured. Please check your .env.local file.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is not configured. Please check your .env.local file.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file to Supabase Storage.
 * @param file The file to upload.
 * @param pathPrefix The prefix for the path in the bucket (e.g., 'avatars' or 'backgrounds').
 * @param bucketName The name of the Supabase bucket. Defaults to 'character-assets'.
 * @returns The public URL of the uploaded file.
 * @throws If the upload fails.
 */
export async function uploadCharacterAsset(
  file: File,
  pathPrefix: 'avatars' | 'backgrounds',
  bucketName: string = 'character-assets'
): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`; // Simple random name to avoid conflicts
  const filePath = `${pathPrefix}/${fileName}`;

  // IMPORTANT: If you receive a 403 "Unauthorized" error with "new row violates row-level security policy",
  // you MUST configure Row Level Security (RLS) policies on your Supabase bucket.
  // See the "Bucket Policies" section in your project's README.md for example SQL policies
  // that grant the 'anon' role permission to insert into the 'storage.objects' table
  // for the specified bucket and paths.
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: false, // Don't overwrite existing files with the same name (though random name makes this less likely)
    });

  if (error) {
    // Enhanced error logging
    console.error('Raw Supabase upload error object:', JSON.stringify(error, null, 2));
    
    let detailedErrorMessage = 'Unknown Supabase storage error occurred.';
    if (error.message) {
      detailedErrorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Attempt to serialize the error object if it's not a standard Error instance
      try {
        const errorString = JSON.stringify(error);
        if (errorString !== '{}') { // Avoid just showing an empty object
          detailedErrorMessage = errorString;
        }
      } catch (e) {
        // Fallback if stringification fails
        detailedErrorMessage = 'Supabase returned a non-serializable error object.';
      }
    } else if (typeof error === 'string') {
      detailedErrorMessage = error;
    }

    console.error('Error uploading file to Supabase. Details:', detailedErrorMessage);
    throw new Error(`Supabase storage error: ${detailedErrorMessage}`);
  }

  if (!data || !data.path) {
    throw new Error('Supabase upload did not return a path.');
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${data.path}`;
  
  return publicUrl;
}

