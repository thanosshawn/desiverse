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

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: false, // Don't overwrite existing files with the same name (though random name makes this less likely)
    });

  if (error) {
    console.error('Error uploading file to Supabase:', error);
    throw new Error(`Supabase storage error: ${error.message}`);
  }

  if (!data || !data.path) {
    throw new Error('Supabase upload did not return a path.');
  }

  // Construct the public URL
  // Note: This assumes your bucket is public and follows the standard URL structure.
  // Supabase client's `getPublicUrl` is often preferred but can be slightly more complex to set up initially.
  // For a public bucket, constructing the URL directly is common.
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${data.path}`;
  
  // Alternative using Supabase's getPublicUrl method:
  // const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
  // if (!urlData || !urlData.publicUrl) {
  //   throw new Error('Failed to get public URL for uploaded file from Supabase.');
  // }
  // const publicUrl = urlData.publicUrl;

  return publicUrl;
}
