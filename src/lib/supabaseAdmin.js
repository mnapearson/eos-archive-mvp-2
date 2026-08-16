// src/lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

// Lazy on purpose: Next.js evaluates every route module's top-level code
// during `next build`'s page-data-collection pass, so a client created
// eagerly at module scope throws "supabaseKey is required" in any
// environment where SUPABASE_SERVICE_ROLE_KEY isn't set at build time —
// including CI jobs that only need this app to build, not to actually call
// anything requiring elevated privileges (confirmed: broke test.yml's e2e
// job, which intentionally doesn't get this secret).
let client;

export function getSupabaseAdmin() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return client;
}
