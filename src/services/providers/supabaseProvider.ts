/**
 * Supabase implementation of the service layer.
 * Wraps the Supabase client SDK so the rest of the app never imports it directly.
 */

import { supabase } from '@/integrations/supabase/client';

// ─── Raw client access (for query-builder patterns during migration) ──
export const getSupabaseClient = () => supabase;

// Re-export the client under a provider-agnostic name.
// Components use `db.from("table")`, `db.auth`, `db.storage`, `db.channel()`.
// When switching providers, only THIS file changes.
export const db = supabase;
