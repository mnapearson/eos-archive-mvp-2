'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

// Finishes a space signup that was deferred because email confirmation was
// required at signup time (see src/app/spaces/signup/page.js) — the account
// now has a session, so the space record staged in localStorage under
// pendingSpaceRegistration can actually be created.
export default function CompleteSpaceSignUpPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [status, setStatus] = useState('working');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
