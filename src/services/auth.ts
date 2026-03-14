/**
 * Authentication service abstraction.
 *
 * Usage:
 *   import { auth } from "@/services/auth";
 *   const { data, error } = await auth.signInWithPassword({ email, password });
 */

import { DATA_PROVIDER } from './config';
import { db } from './providers/supabaseProvider';

function createAuthService() {
  switch (DATA_PROVIDER) {
    case 'supabase':
      return db.auth;
    case 'backend':
      // Future: implement JWT-based auth against your REST API
      console.warn('[services/auth] Backend auth not yet implemented, falling back to Supabase.');
      return db.auth;
    default:
      return db.auth;
  }
}

export const auth = createAuthService();
