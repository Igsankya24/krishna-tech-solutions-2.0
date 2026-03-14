/**
 * Database service — single entry point for all data operations.
 *
 * Components import from here instead of the Supabase client directly.
 * Switching providers only requires changing the implementation in this file.
 *
 * Usage (preferred):
 *   import { db } from "@/services/database";
 *   const { data } = await db.from("services").select("*");
 *
 * Usage (backwards-compatible alias — migrate away from this):
 *   import { supabase } from "@/services/database";
 */

import { DATA_PROVIDER } from './config';
import { db as supabaseDb } from './providers/supabaseProvider';

function createDatabaseClient() {
  switch (DATA_PROVIDER) {
    case 'supabase':
      return supabaseDb;
    case 'backend':
      console.warn('[services/database] Backend provider not yet implemented, falling back to default.');
      return supabaseDb;
    default:
      return supabaseDb;
  }
}

export const db = createDatabaseClient();

// Backwards-compatible alias — all existing imports can swap to this file
// without renaming every `supabase.` reference in component bodies.
// TODO: Gradually rename to `db` and remove this alias.
export const supabase = db;
