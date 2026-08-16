'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { withTimeout } from '@/lib/withTimeout';

// Root cause of the getSession() hangs traced live this session (on
// /spaces/signup/complete, but the same shape applies anywhere): multiple
// components independently call supabase.auth.getSession()/subscribe to
// onAuthStateChange on the same page load — NavBar (via useUserProfile,
// mounted globally in layout.js) racing against whatever the page itself
// does. This trips a known upstream issue in Supabase's auth client: its
// Web Locks–based session lock isn't fully reentrant, and concurrent calls
// into it from the same page can deadlock with no console error. Already
// ruled out separately: stale cached JS (still hung with cache disabled),
// and a distinct multi-GoTrueClient-instance bug (fixed separately
// earlier — see supabaseBrowserClient.js — but the hang persisted after
// that fix too, proving it wasn't the whole story).
//
// Fix: exactly one getSession() call and exactly one onAuthStateChange
// subscription for the entire app, made here, once, at the root. Every
// consumer reads from this shared result instead of asking Supabase
// independently — eliminating the race at its source rather than working
// around each symptom page by page.
const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }) {
  const supabase = useRef(getSupabaseBrowserClient()).current;
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const {
          data: { session: initialSession },
        } = await withTimeout(supabase.auth.getSession());
        if (cancelled) return;
        setSession(initialSession ?? null);
        setError(null);
      } catch (err) {
        // Bounded-timeout backstop: with the race eliminated at the
        // source, this should now be a rare defense-in-depth path rather
        // than the primary one — but if this exact class of bug
        // resurfaces, surface it explicitly instead of hanging the whole
        // app's auth state forever.
        if (!cancelled) {
          console.error('AuthContext: getSession() did not resolve:', err);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession ?? null);
      setLoading(false);
      setError(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name, bio, location')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
    setProfileLoading(false);
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    fetchProfile(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, supabase]);

  const value = {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    // Separate from `loading`: `loading` covers the one getSession() call;
    // `profileLoading` covers the profiles fetch that follows once a
    // session exists. A strict role gate (e.g. the site admin panel) needs
    // to wait for both — checking profile?.role before profileLoading
    // settles would treat "haven't fetched yet" the same as "confirmed not
    // this role" and could bounce a legitimate user during the fetch.
    profileLoading,
    error,
    // Callable so a page that just wrote to `profiles` itself (e.g.
    // account/page.js saving display_name/bio/location) can refresh the
    // one shared copy instead of drifting out of sync with what's
    // actually in the database, or reaching for a setProfile this
    // context deliberately doesn't expose (writes should go through
    // Supabase, not directly mutate shared state).
    refreshProfile: () => fetchProfile(session?.user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
