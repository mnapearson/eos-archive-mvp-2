'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className='max-w-lg mx-auto glow-box'>
      <form
        onSubmit={handleLogin}
        className='space-y-4'>
        <div>
          <label className='block mb-1 text-sm'>email</label>
          <input
            type='email'
            className='border p-2 w-full'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>password</label>
          <input
            type='password'
            className='border p-2 w-full'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {errorMsg && <p className='text-red-500 text-sm'>{errorMsg}</p>}
        <button
          type='submit'
          className='glow-button'
          disabled={loading}>
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </form>
      <p className='mt-10 text-sm'>
        Are you part of a subcultural space and want to become a member of the
        archive?{' '}
        <a
          href='/spaces/signup'
          className='underline'>
          Register here.
        </a>
      </p>
    </div>
  );
}
