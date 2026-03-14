/**
 * File storage service abstraction.
 *
 * Usage:
 *   import { storage } from "@/services/storage";
 *   const { data, error } = await storage.from("avatars").upload(path, file);
 *   const { data: { publicUrl } } = storage.from("avatars").getPublicUrl(path);
 */

import { DATA_PROVIDER } from './config';
import { db } from './providers/supabaseProvider';

function createStorageService() {
  switch (DATA_PROVIDER) {
    case 'supabase':
      return db.storage;
    case 'backend':
      // Future: implement against S3-compatible or custom storage API
      console.warn('[services/storage] Backend storage not yet implemented, falling back to Supabase.');
      return db.storage;
    default:
      return db.storage;
  }
}

export const storage = createStorageService();
