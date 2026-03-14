/**
 * Database service — single entry point for all data operations.
 *
 * Components import `db` from here instead of the Supabase client directly.
 * Switching providers only requires changing the implementation in this file.
 *
 * Usage:
 *   import { db } from "@/services/database";
 *   const { data } = await db.from("services").select("*");
 */

import { DATA_PROVIDER } from './config';
import { db as supabaseDb } from './providers/supabaseProvider';

// Provider selection — currently only Supabase is fully implemented.
// When VITE_DATA_PROVIDER=backend is supported, swap here.
function createDatabaseClient() {
  switch (DATA_PROVIDER) {
    case 'supabase':
      return supabaseDb;
    case 'backend':
      // Future: return a client that talks to your REST API.
      // For now, fall back to Supabase to keep the app running.
      console.warn('[services/database] Backend provider not yet implemented, falling back to Supabase.');
      return supabaseDb;
    default:
      return supabaseDb;
  }
}

export const db = createDatabaseClient();
