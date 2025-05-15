'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
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
    <div className='max-w-lg mx-auto glow-box mt-10'>
      <form
        onSubmit={handleLogin}
        className='space-y-4'>
        <div>
          <label className='block mb-1 text-sm'>email</label>
          <input
            type='email'
            className='input'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>password</label>
          <input
            type='password'
            className='input'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type='submit'
          className='glow-button'
          disabled={loading}>
          {loading ? 'Connecting...' : 'Connect'}
        </button>{' '}
        <p className='mt-10 text-sm italic text-center'>
          Need help connecting? Get in touch with us,{' '}
          <a
            href='mailto:hello@eosarchive.app'
            className='hover:underline'>
            hello@eosarchive.app
          </a>
        </p>
        {/* <button
          type='button'
          className='text-xs underline mx-auto w-full'
          onClick={handleResetPassword}
          disabled={loading}>
          {loading ? 'Processing...' : 'Forgot Password?'}
        </button> */}
      </form>
    </div>
  );
}
