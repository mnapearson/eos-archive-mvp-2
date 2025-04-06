'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const token = searchParams.get('code');
  // Usually the URL will have type=reset_password; you can optionally check it:
  const type = searchParams.get('type');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!token) {
      setErrorMsg('Invalid or missing token.');
      return;
    }

    setLoading(true);

    // Call Supabase's verifyOTP to reset the password.
    // This will also sign the user in if successful.
    const { error } = await supabase.auth.verifyOTP({
      token: token,
      type: 'reset_password', // you may check that type === 'reset_password'
      password: newPassword,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setInfoMsg('Your password has been reset successfully. Redirecting...');
      // Redirect to the home page (or dashboard) after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <div className='max-w-lg mx-auto mt-10'>
      <form
        onSubmit={handleResetPassword}
        className='space-y-4 glow-box '>
        <div>
          <label className='block mb-1 text-sm text-[var(--foreground)]'>
            new password
          </label>
          <input
            type='password'
            className='input'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm text-[var(--foreground)]'>
            confirm new password
          </label>
          <input
            type='password'
            className='input'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {errorMsg && <p className='text-red-500 text-sm'>{errorMsg}</p>}
        {infoMsg && <p className='text-green-500 text-sm'>{infoMsg}</p>}
        <button
          type='submit'
          className='glow-button'
          disabled={loading}>
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>
      <p className='mt-10'>
        In need of further help? Get in touch with us,{' '}
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
