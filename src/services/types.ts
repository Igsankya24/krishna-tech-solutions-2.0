/**
 * Database-agnostic service layer types.
 * All application code should interact through these interfaces,
 * never directly with a specific database SDK.
 */

// ─── Query Options ───────────────────────────────────────────
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

export interface QueryOrder {
  column: string;
  ascending?: boolean;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  order?: QueryOrder[];
  limit?: number;
  offset?: number;
  select?: string;
}

// ─── Data Provider Interface ─────────────────────────────────
export interface DataProvider {
  /** Fetch rows from a table with optional filters/ordering */
  query<T = Record<string, unknown>>(table: string, options?: QueryOptions): Promise<{ data: T[] | null; error: Error | null }>;

  /** Insert one or more rows */
  insert<T = Record<string, unknown>>(table: string, data: Partial<T> | Partial<T>[]): Promise<{ data: T[] | null; error: Error | null }>;

  /** Update rows matching filters */
  update<T = Record<string, unknown>>(table: string, data: Partial<T>, filters: QueryFilter[]): Promise<{ data: T[] | null; error: Error | null }>;

  /** Delete rows matching filters */
  remove(table: string, filters: QueryFilter[]): Promise<{ error: Error | null }>;

  /** Upsert (insert or update) */
  upsert<T = Record<string, unknown>>(table: string, data: Partial<T> | Partial<T>[], options?: { onConflict?: string }): Promise<{ data: T[] | null; error: Error | null }>;
}

// ─── Auth Provider Interface ─────────────────────────────────
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  user: AuthUser;
}

export interface AuthProvider {
  signIn(email: string, password: string): Promise<{ data: { user: AuthUser | null; session: AuthSession | null }; error: Error | null }>;
  signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<{ data: { user: AuthUser | null }; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  getSession(): Promise<{ data: { session: AuthSession | null } }>;
  getUser(): Promise<{ data: { user: AuthUser | null } }>;
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void): { data: { subscription: { unsubscribe: () => void } } };
  updateUser(attributes: Record<string, unknown>): Promise<{ error: Error | null }>;
  resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ error: Error | null }>;
}

// ─── Storage Provider Interface ──────────────────────────────
export interface StorageProvider {
  upload(bucket: string, path: string, file: File | Blob, options?: { upsert?: boolean; contentType?: string }): Promise<{ data: { path: string } | null; error: Error | null }>;
  remove(bucket: string, paths: string[]): Promise<{ error: Error | null }>;
  getPublicUrl(bucket: string, path: string): string;
  list(bucket: string, path?: string): Promise<{ data: { name: string }[] | null; error: Error | null }>;
}

// ─── Realtime Provider Interface ─────────────────────────────
export interface RealtimeChannel {
  on(event: string, config: Record<string, unknown>, callback: (payload: unknown) => void): RealtimeChannel;
  subscribe(callback?: (status: string) => void): RealtimeChannel;
  unsubscribe(): void;
  track(payload: Record<string, unknown>): Promise<void>;
  presenceState(): Record<string, unknown[]>;
}

export interface RealtimeProvider {
  channel(name: string, config?: Record<string, unknown>): RealtimeChannel;
  removeChannel(channel: RealtimeChannel): void;
}

// ─── Supported Providers ─────────────────────────────────────
export type DataProviderType = 'supabase' | 'backend';
