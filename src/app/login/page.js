'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import toast from 'react-hot-toast';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const redirectTo = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getSiteUrl = () => {
    const envUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, '');
    }
    return typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast.error('Please confirm your email address before signing in. Check your inbox for a confirmation link.');
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    toast.success('Logged in successfully!');

    // A redirect param (e.g. from the space-detail "been here"/notes gate)
    // takes priority over role-based routing, so a signed-out visitor
    // lands back on the specific page they were trying to use rather than
    // always on /account or /spaces/admin. Only followed if it's a
    // same-site relative path — redirectTo comes from a URL query param, so
    // an unvalidated value here would be an open-redirect vector (e.g.
    // ?redirect=https://evil.example landing a just-authenticated user on
    // an attacker-controlled page).
    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      router.push(redirectTo);
      setLoading(false);
      return;
    }

    // Route by role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileData?.role === 'member') {
      router.push('/account');
    } else {
      router.push('/spaces/admin');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    const redirectTo = `${getSiteUrl()}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        'A password reset email has been sent. Please check your inbox.'
      );
    }
    setLoading(false);
  };

  return (
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
        <header className='space-y-4'>
          <span className='ea-label ea-label--muted'>Member Access</span>
          <h1 className='quick-view__title text-balance'>
            Sign in to eos archive
          </h1>
          <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70 sm:text-base'>
            Enter your credentials to access your account. Need support? Drop us a line at{' '}
            <a
              href='mailto:hello@eosarchive.app'
              className='underline underline-offset-4 hover:text-[var(--foreground)]'>
              hello@eosarchive.app
            </a>
            .
          </p>
        </header>

        <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-8 backdrop-blur-2xl sm:px-12 sm:py-12'>
        <form
          onSubmit={handleLogin}
          className='mt-10 space-y-6'>
          <fieldset className='space-y-6'>
            <div className='space-y-2'>
              <label
                htmlFor='email'
                className='ea-label ea-label--muted'>
                Email
              </label>
              <input
                id='email'
                type='email'
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete='email'
                required
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='password'
                className='ea-label ea-label--muted'>
                Password
              </label>
              <input
                id='password'
                type='password'
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='current-password'
                required
              />
            </div>
          </fieldset>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <button
              type='submit'
              className='nav-action nav-cta !inline-flex flex-1 justify-center px-6 text-[12px] uppercase tracking-[0.32em] disabled:cursor-not-allowed disabled:opacity-60'
              disabled={loading}>
              {loading ? 'Connecting…' : 'Connect'}
            </button>

            <button
              type='button'
              onClick={handleResetPassword}
              disabled={loading}
              className='nav-action !inline-flex justify-center px-6 text-[11px] uppercase tracking-[0.28em] hover:border-[var(--foreground)]/35 disabled:cursor-not-allowed disabled:opacity-60'>
              {loading ? 'Sending…' : 'Reset password'}
            </button>
          </div>
        </form>
        </section>

        <p className='text-sm text-[var(--foreground)]/55'>
          Don&apos;t have an account?{' '}
          <Link
            href='/signup'
            className='underline underline-offset-4 hover:text-[var(--foreground)]'>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
