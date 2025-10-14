'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
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
    // Customize the redirect URL as needed.
    const redirectTo = window.location.origin + '/reset-password';
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
            Enter your credentials to manage spaces and upcoming events. Need support? Drop us a line at{' '}
            <a
              href='mailto:hello@eosarchive.app'
              className='underline underline-offset-4 hover:text-[var(--foreground)]'>
              hello@eosarchive.app
            </a>
            .
          </p>
        </header>

        <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:px-12 sm:py-12'>
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
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
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
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
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
              className='nav-action nav-cta !inline-flex h-11 flex-1 justify-center px-6 text-[12px] uppercase tracking-[0.32em] shadow-[0_18px_48px_rgba(0,0,0,0.28)] disabled:cursor-not-allowed disabled:opacity-60'
              disabled={loading}>
              {loading ? 'Connecting…' : 'Connect'}
            </button>

            <button
              type='button'
              onClick={handleResetPassword}
              disabled={loading}
              className='nav-action !inline-flex h-10 justify-center px-6 text-[11px] uppercase tracking-[0.28em] hover:border-[var(--foreground)]/35 disabled:cursor-not-allowed disabled:opacity-60'>
              {loading ? 'Sending…' : 'Reset password'}
            </button>
          </div>
        </form>
        </section>
      </div>
    </main>
  );
}
