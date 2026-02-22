
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadImage as mockUpload } from './cloudinaryService';

/**
 * Storage Service
 * Handles uploading files to Supabase Storage.
 * Falls back to mock base64 conversion if Supabase is not configured or fails.
 */
export const storageService = {
  
  /**
   * Upload a file to a specific bucket and path.
   * @param file The file object to upload.
   * @param bucket The storage bucket name (e.g., 'products').
   * @param path The path/filename within the bucket.
   * @returns Promise resolving to the public URL of the uploaded file.
   */
  async uploadFile(file: File, bucket: string, path: string): Promise<string> {
    // 1. Check Configuration
    if (!isSupabaseConfigured || !supabase) {
      console.warn("Supabase not configured, using mock upload.");
      return mockUpload(file);
    }

    try {
      // 2. Upload to Supabase
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Supabase Storage Upload Error:', error.message);
        
        // Specific check for bucket not found
        if (error.message.includes('Bucket not found') || error.message.includes('row not found')) {
            console.warn(`Bucket '${bucket}' does not exist in Supabase Storage. Please run the setup SQL or create it in the Dashboard.`);
            // Fallback to mock upload so the app doesn't break
            return mockUpload(file);
        }

        // Other errors, try mock as fallback
        return mockUpload(file);
      }

      // 3. Get Public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (e) {
      console.error('Storage Service Exception:', e);
      return mockUpload(file);
    }
  },

  /**
   * Delete files from storage
   */
  async deleteFiles(bucket: string, paths: string[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase || paths.length === 0) return;
    
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);
      
      if (error) {
        console.error('Supabase Storage Delete Error:', error.message);
      }
    } catch (e) {
      console.error('Storage Delete Exception:', e);
    }
  },

  /**
   * Extract storage path from public URL
   */
  getPathFromUrl(url: string): string | null {
    try {
      if (!url.includes('/storage/v1/object/public/')) return null;
      const parts = url.split('/storage/v1/object/public/');
      if (parts.length < 2) return null;
      // The second part is "bucket/path/to/file"
      // We need to strip the bucket name if the remove method expects path relative to bucket
      // Supabase .from(bucket).remove([path]) expects path relative to bucket root.
      
      const bucketAndPath = parts[1];
      const firstSlash = bucketAndPath.indexOf('/');
      if (firstSlash === -1) return null;
      
      return decodeURIComponent(bucketAndPath.substring(firstSlash + 1));
    } catch (e) {
      return null;
    }
  }
};
