// src/lib/supabaseBrowserClient.js
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Client Components render once server-side (as part of SSR) and then again
// in the browser after hydration. On the server, the Next.js process is
// long-lived and shared across many different users' concurrent requests —
// caching a client there would risk one request's session leaking into
// another's, so every server-side call gets a fresh, request-scoped client
// exactly like createClientComponentClient() did on its own before this
// file existed. In the browser there's only ever one user per tab, so
// caching there is what fixes the bug this file exists for.
//
// This file replaces every direct createClientComponentClient() call across
// the app (18 call sites originally). The actual root cause, traced live by
// patching console.warn to capture a stack trace: it wasn't those 18 call
// sites racing each other (each already correctly returned the same cached
// instance) — it was src/lib/supabaseClient.js, a *separate* plain
// createClient() wrapper used by several other client-rendered
// files (e.g. useCities.js, SpaceReviewPanel.js), constructing its own
// independent GoTrueClient against the same Supabase project. Both clients
// end up managing the same localStorage session key concurrently ("Multiple
// GoTrueClient instances detected..."), which is what caused
// supabase.auth.getSession() to hang indefinitely on
// /spaces/signup/complete. Every client-rendered (not pure Server
// Component) file that used supabaseClient.js was migrated to this shared
// client too — genuinely server-only files (API routes, Server Components)
// were deliberately left on the plain anon client, since that's correct and
// safe there.
//
// A plain module-level `let` isn't enough to cache this on its own — Next.js's
// bundler doesn't guarantee a small shared module lands in one shared chunk;
// it can get inlined separately into each importing chunk, giving different
// call sites their own independent module state despite being "the same"
// source file. globalThis sidesteps that: it's the one truly shared object
// for the whole browser tab regardless of how the bundler split the modules
// (same reason supabaseClient.js already caches its own client this way).
const globalRef = typeof globalThis !== 'undefined' ? globalThis : window;

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    return createClientComponentClient();
  }
  if (!globalRef._supabaseBrowserClient) {
    globalRef._supabaseBrowserClient = createClientComponentClient();
  }
  return globalRef._supabaseBrowserClient;
}
