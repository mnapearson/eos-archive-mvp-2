'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import toast from 'react-hot-toast';

// getSession() on the shared client can hang indefinitely here specifically
// (confirmed live: reproducible regardless of account type or how the page
// is reached, and NavBar's own getSession() call hangs right alongside it —
// a page-load-level stall, not something wrong with this page's own code).
// Root cause isn't fully pinned down: @supabase/auth-helpers-nextjs is a
// deprecated package (Supabase's own guidance is to migrate to
// @supabase/ssr) pinned against @supabase/supabase-js@^2.39.8 as a peer
// dependency, but this app runs 2.57.2, pulling in
// @supabase/auth-js@2.71.1 — auth-js's internal session lock has changed
// substantially since 2.39, and this old wrapper was never updated against
// it. But a fresh, entirely unshared client hung identically in testing,
// which points at least partly at something network/rate-limit related
// rather than purely a stuck lock on the shared instance (this session did
// a very large volume of real signups today and hit a hard 429 on
// /auth/v1/signup earlier) — not cleanly distinguished from the deprecated-
// package theory before this was shipped. A full migration off
// auth-helpers-nextjs is the real fix if this keeps happening, but is a
// much bigger, app-wide change than justified unilaterally here. This is a
// bounded mitigation, not a confirmed fix: race getSession() against a
// timeout, fall back to a fresh client on failure, and — critically — never
// leave the user stuck on "Finishing your submission…" with zero feedback
// if even that fails, matching the same principle behind signup/page.js's
// earlier try/catch/finally fix (a stuck screen with no error is worse than
// a clear failure message).
async function getSessionWithFallback(supabase) {
  const withTimeout = (promise, ms) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
    ]);

  try {
    return await withTimeout(supabase.auth.getSession(), 5000);
  } catch {
    const fallbackClient = createClientComponentClient();
    return withTimeout(fallbackClient.auth.getSession(), 5000);
  }
}

// Finishes a space signup that was deferred because email confirmation was
// required at signup time (see src/app/spaces/signup/page.js) — the account
// now has a session, so the space record staged in localStorage under
// pendingSpaceRegistration can actually be created.
export default function CompleteSpaceSignUpPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [status, setStatus] = useState('working');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      let session = null;
      try {
        ({
          data: { session },
        } = await getSessionWithFallback(supabase));
      } catch (err) {
        console.error('getSession() did not resolve even with fallback:', err);
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
  }, [router, supabase]);

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

        <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:px-12 sm:py-12'>
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
                  className='nav-action nav-cta !inline-flex h-11 px-8 text-[12px] uppercase tracking-[0.32em]'>
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
                  className='nav-action nav-cta !inline-flex h-11 px-8 text-[12px] uppercase tracking-[0.32em]'>
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
