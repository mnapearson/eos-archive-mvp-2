'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import Spinner from '@/components/Spinner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [status, setStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const prepareSession = async () => {
      setErrorMessage('');
      try {
        const { data: existing } = await supabase.auth.getSession();
        if (existing?.session) {
          if (isActive) setStatus('ready');
          return;
        }

        if (typeof window === 'undefined' || !window.location.hash) {
          if (isActive) setStatus('no_token');
          return;
        }

        const { error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        });

        if (error) {
          console.error('Unable to establish recovery session', error);
          if (isActive) {
            setErrorMessage(error.message);
            setStatus('error');
          }
          return;
        }

        window.location.hash = '';
        if (isActive) setStatus('ready');
      } catch (err) {
        console.error('Unexpected error during password recovery', err);
        if (isActive) {
          setErrorMessage(
            'We could not confirm your reset link. Please request a new email.'
          );
          setStatus('error');
        }
      }
    };

    prepareSession();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password.trim().length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Password updated. You can now sign in with your new password.');
    router.push('/login');
    router.refresh();
  };

  const renderContent = () => {
    if (status === 'checking') {
      return (
        <div className='flex flex-col items-center gap-4 py-16 text-sm text-[var(--foreground)]/70'>
          <Spinner />
          <p>Verifying your reset link…</p>
        </div>
      );
    }

    if (status === 'no_token') {
      return (
        <div className='space-y-4 rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 p-8 text-sm text-[var(--foreground)]/80 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:p-12'>
          <p>
            This page requires a reset link from your email. Please return to the{' '}
            <button
              type='button'
              onClick={() => router.push('/login')}
              className='underline underline-offset-4 transition hover:text-[var(--foreground)]'>
              login page
            </button>{' '}
            to request a new password reset email.
          </p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className='space-y-6 rounded-[32px] border border-red-500/30 bg-red-500/5 p-8 text-sm text-red-600 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:p-12'>
          <p>{errorMessage || 'Something went wrong while processing your reset link.'}</p>
          <div>
            <button
              type='button'
              onClick={() => router.push('/login')}
              className='nav-action'>
              Request a new link
            </button>
          </div>
        </div>
      );
    }

    return (
      <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:px-12 sm:py-12'>
        <form
          onSubmit={handleSubmit}
          className='space-y-6'>
          <div className='space-y-2'>
            <label
              htmlFor='password'
              className='ea-label ea-label--muted'>
              New password
            </label>
            <input
              id='password'
              type='password'
              autoComplete='new-password'
              className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='confirm-password'
              className='ea-label ea-label--muted'>
              Confirm password
            </label>
            <input
              id='confirm-password'
              type='password'
              autoComplete='new-password'
              className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <button
              type='submit'
              className='nav-action nav-cta !inline-flex h-11 flex-1 justify-center px-6 text-[12px] uppercase tracking-[0.32em] shadow-[0_18px_48px_rgba(0,0,0,0.28)] disabled:cursor-not-allowed disabled:opacity-60'
              disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>

            <button
              type='button'
              onClick={() => router.push('/login')}
              className='nav-action !inline-flex h-10 justify-center px-6 text-[11px] uppercase tracking-[0.28em] hover:border-[var(--foreground)]/35'>
              Return to login
            </button>
          </div>
        </form>
      </section>
    );
  };

  return (
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
        <header className='space-y-4'>
          <span className='ea-label ea-label--muted'>Password reset</span>
          <h1 className='quick-view__title text-balance'>Set a new password</h1>
          <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70 sm:text-base'>
            Choose a strong password to keep your account secure. This link expires shortly after it&apos;s sent, so finish the update soon after opening the email.
          </p>
        </header>

        {renderContent()}
      </div>
    </main>
  );
}
