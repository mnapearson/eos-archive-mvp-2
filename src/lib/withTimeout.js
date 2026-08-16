// Races a promise against a timeout, rejecting instead of hanging forever.
// Exists because certain Supabase calls have been observed live to
// occasionally never resolve (traced once, for supabase.auth.getSession()
// on /spaces/signup/complete, to a real but not fully pinned-down version
// gap between the deprecated @supabase/auth-helpers-nextjs and the
// @supabase/auth-js it actually runs against — see that page's own
// comment for the full writeup). Any place issuing a Supabase call whose
// failure to resolve would otherwise strand the UI (infinite spinner, no
// feedback) should race it through this rather than await it directly.
export function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}
