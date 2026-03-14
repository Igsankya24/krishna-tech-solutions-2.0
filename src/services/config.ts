/**
 * Service layer configuration.
 * Controls which data provider is active via environment variable.
 *
 * Set VITE_DATA_PROVIDER in .env:
 *   supabase  — current default (Lovable Cloud / Supabase)
 *   backend   — future custom REST API
 */

import type { DataProviderType } from './types';

export const DATA_PROVIDER: DataProviderType =
  (import.meta.env.VITE_DATA_PROVIDER as DataProviderType) || 'supabase';

export const isSupabaseProvider = () => DATA_PROVIDER === 'supabase';
export const isBackendProvider = () => DATA_PROVIDER === 'backend';
