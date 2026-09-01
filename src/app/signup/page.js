'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const supabase = getSupabaseBrowserClient();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const getSiteUrl = () => {
    const envUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');
    return typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
          data: { display_name: displayName, account_type: 'member' },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setDone(true);
    } catch (err) {
      // Belt-and-suspenders: supabase-js normally resolves to {error}
      // rather than throwing, but an unexpected failure (network drop,
      // malformed response) would otherwise leave the button stuck on
      // "Creating account…" forever with no feedback at all.
      console.error('Unexpected error during sign up:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
        <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
          <header className='space-y-4'>
            <span className='ea-label ea-label--muted'>Account created</span>
            <h1 className='quick-view__title text-balance'>Check your email</h1>
          </header>

          <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-10 backdrop-blur-2xl sm:px-12 sm:py-12'>
            <div className='space-y-6 max-w-lg'>
              <p className='text-sm leading-relaxed text-[var(--foreground)]/75 sm:text-base'>
                We sent a confirmation link to{' '}
                <span className='text-[var(--foreground)] font-medium'>{email}</span>.
                Click it to verify your address and activate your account.
              </p>
              <p className='text-xs leading-relaxed text-[var(--foreground)]/50 uppercase tracking-[0.2em]'>
                The link expires after 24 hours. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href='/login'
                className='nav-action !inline-flex px-6 text-[11px] uppercase tracking-[0.28em]'>
                Back to login
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
        <header className='space-y-4'>
          <span className='ea-label ea-label--muted'>Create account</span>
          <h1 className='quick-view__title text-balance'>Join eos archive</h1>
          <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70 sm:text-base'>
            Create a free account to be part of the archive.{' '}
            <Link
              href='/spaces/signup'
              className='underline underline-offset-4 hover:text-[var(--foreground)]'>
              Registering a space?
            </Link>
          </p>
        </header>

        <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-8 backdrop-blur-2xl sm:px-12 sm:py-12'>
          <form
            onSubmit={handleSignUp}
            className='mt-10 space-y-6'>
            <fieldset className='space-y-6'>
              <div className='space-y-2'>
                <label
                  htmlFor='display-name'
                  className='ea-label ea-label--muted'>
                  Display name
                </label>
                <input
                  id='display-name'
                  type='text'
                  className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete='name'
                  placeholder="How you'll appear on the archive"
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='email'
                  className='ea-label ea-label--muted'>
                  Email*
                </label>
                <input
                  id='email'
                  type='email'
                  data-testid='signup-email'
                  className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete='email'
                  required
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <label
                    htmlFor='password'
                    className='ea-label ea-label--muted'>
                    Password*
                  </label>
                  <input
                    id='password'
                    type='password'
                    data-testid='signup-password'
                    className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete='new-password'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='confirm-password'
                    className='ea-label ea-label--muted'>
                    Confirm password*
                  </label>
                  <input
                    id='confirm-password'
                    type='password'
                    data-testid='signup-password-confirm'
                    className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete='new-password'
                    required
                  />
                </div>
              </div>
            </fieldset>

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <button
                type='submit'
                data-testid='signup-submit'
                className='nav-action nav-cta !inline-flex flex-1 justify-center px-6 text-[12px] uppercase tracking-[0.32em] disabled:cursor-not-allowed disabled:opacity-60'
                disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>

              <Link
                href='/login'
                className='nav-action !inline-flex justify-center px-6 text-[11px] uppercase tracking-[0.28em] hover:border-[var(--foreground)]/35'>
                Already have an account
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
