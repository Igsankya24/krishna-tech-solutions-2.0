/**
 * Realtime / pub-sub service abstraction.
 *
 * Usage:
 *   import { createChannel, removeChannel } from "@/services/realtime";
 *   const channel = createChannel("my-channel");
 *   channel.on("postgres_changes", { ... }, callback).subscribe();
 */

import { DATA_PROVIDER } from './config';
import { db } from './providers/supabaseProvider';

export function createChannel(name: string, config?: Record<string, unknown>) {
  switch (DATA_PROVIDER) {
    case 'supabase':
      return db.channel(name, config as any);
    case 'backend':
      // Future: implement WebSocket / Socket.IO channel
      console.warn('[services/realtime] Backend realtime not yet implemented, falling back to Supabase.');
      return db.channel(name, config as any);
    default:
      return db.channel(name, config as any);
  }
}

export function removeChannel(channel: ReturnType<typeof db.channel>) {
  switch (DATA_PROVIDER) {
    case 'supabase':
      return db.removeChannel(channel);
    default:
      return db.removeChannel(channel);
  }
}
