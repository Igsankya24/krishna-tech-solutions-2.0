/**
 * Service layer barrel export.
 *
 * All application code should import from here or from individual service files:
 *   import { db } from "@/services/database";
 *   import { auth } from "@/services/auth";
 *   import { storage } from "@/services/storage";
 *   import { createChannel, removeChannel } from "@/services/realtime";
 */

export { db } from './database';
export { auth } from './auth';
export { storage } from './storage';
export { createChannel, removeChannel } from './realtime';
export { DATA_PROVIDER } from './config';
export type * from './types';
