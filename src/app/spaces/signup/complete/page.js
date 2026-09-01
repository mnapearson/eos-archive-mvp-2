'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// Finishes a space signup that was deferred because email confirmation was
// required at signup time (see src/app/spaces/signup/page.js) — the account
// now has a session, so the space record staged in localStorage under
// pendingSpaceRegistration can actually be created.
//
// Previously called supabase.auth.getSession() directly here, which was
// the exact call confirmed live to hang on this page (racing against
// NavBar's own independent auth-state read on the same page load). Fixed
// at the source: session now comes from AuthContext, the one shared
// getSession() call for the whole app — see AuthContext.js for the full
// writeup. This page no longer needs its own timeout/fallback logic; that
// backstop now lives once, in the provider.
export default function CompleteSpaceSignUpPage() {
  const router = useRouter();
  const { session, loading: authLoading, error: authError } = useAuth();
  const [status, setStatus] = useState('working');
  const [errorMessage, setErrorMessage] = useState('');
  // AuthContext's onAuthStateChange can fire more than once in quick
  // succession for the same underlying session (e.g. a SIGNED_IN event
  // immediately followed by a TOKEN_REFRESHED one, which is common right
  // after a PKCE code exchange) — each firing hands this effect a new
  // `session` object, even when the login it describes hasn't changed.
  // Confirmed live: without this guard, that could refire complete() a
  // second time before the first POST /api/spaces/register finished,
  // hitting spaces_name_unique on the retry. This ref makes the actual
  // registration attempt genuinely idempotent, not just cancelled-flagged.
  const attemptedRef = useRef(false);

  useEffect(() => {
    // Don't race ahead of AuthContext resolving — reading
    // pendingSpaceRegistration or calling the register API before the
    // provider has settled one way or the other would repeat the exact
    // "acted on an unknown session state" bug this page used to have.
    if (authLoading) return;
    if (attemptedRef.current) return;

    let cancelled = false;
    attemptedRef.current = true;

    async function complete() {
      if (authError) {
        console.error('AuthContext failed to resolve a session:', authError);
        if (!cancelled) {
          setErrorMessage(
            'We could not confirm your session. Please refresh this page, or log in again.'
          );
          setStatus('error');
        }
        return;
      }

      if (!session) {
        router.push('/login');
        return;
      }

      let pending = null;
      try {
        const raw = localStorage.getItem('pendingSpaceRegistration');
        pending = raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.error('Unable to read pending space registration:', err);
      }

      if (!pending) {
        if (!cancelled) setStatus('missing');
        return;
      }

      const res = await fetch('/api/spaces/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(pending),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        if (!cancelled) {
          setErrorMessage(
            error || 'Something went wrong creating your space. Please try again.'
          );
          setStatus('error');
        }
        return;
      }

      try {
        localStorage.removeItem('pendingSpaceRegistration');
      } catch {
        // Ignore — non-fatal, worst case a stale entry sits unused.
      }

      if (cancelled) return;
      toast.success('Your space has been submitted for review.');
      router.push('/spaces/admin');
    }

    complete();
    return () => {
      cancelled = true;
    };
  }, [router, session, authLoading, authError]);

  return (
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
        <header className='space-y-4'>
          <span className='ea-label ea-label--muted'>Space onboarding</span>
          <h1 className='quick-view__title text-balance'>
            {status === 'working' && 'Finishing your submission…'}
            {status === 'missing' && "We couldn't find your space details"}
            {status === 'error' && 'Something went wrong'}
          </h1>
        </header>

        <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-10 backdrop-blur-2xl sm:px-12 sm:py-12'>
          <div className='space-y-6 max-w-lg'>
            {status === 'working' && (
              <p className='text-sm leading-relaxed text-[var(--foreground)]/75 sm:text-base'>
                Your email is confirmed — creating your space listing now.
              </p>
            )}

            {status === 'missing' && (
              <>
                <p className='text-sm leading-relaxed text-[var(--foreground)]/75 sm:text-base'>
                  Your account is confirmed, but we couldn&apos;t find the space
                  details you submitted — this can happen if you confirmed your
                  email in a different browser than the one you signed up in.
                  Please re-submit your listing.
                </p>
                <Link
                  href='/spaces/signup'
                  className='nav-action nav-cta !inline-flex px-8 text-[12px] uppercase tracking-[0.32em]'>
                  Register your space
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <p className='text-sm leading-relaxed text-[var(--foreground)]/75 sm:text-base'>
                  {errorMessage}
                </p>
                <Link
                  href='/spaces/signup'
                  className='nav-action nav-cta !inline-flex px-8 text-[12px] uppercase tracking-[0.32em]'>
                  Try again
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
