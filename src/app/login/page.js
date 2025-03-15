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
    <div className='max-w-md mx-auto p-4'>
      <h1 className='font-bold mb-4'>login</h1>
      <form
        onSubmit={handleLogin}
        className='space-y-4'>
        <div>
          <label className='block mb-1 text-sm'>Email</label>
          <input
            type='email'
            className='border p-2 w-full'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Password</label>
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
          className='w-full py-2 bg-[var(--foreground)] text-[var(--background)] rounded'
          disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className='mt-4 text-sm'>
        Are you part of a subcultural space, but don't have an account? Get in
        touch with us,{' '}
        <a
          href='mailto:hello@eosarchive.app'
          className='hover:underline'>
          hello@eosarchive.app
        </a>
        .
      </p>
    </div>
  );
}
