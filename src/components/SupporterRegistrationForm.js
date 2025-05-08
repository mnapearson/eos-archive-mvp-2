'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

export default function SupporterRegistrationForm({ user }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    // Update user password
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      toast.error(authError.message);
      return;
    }

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, role: 'member', username });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      toast.error('Error saving profile. Please try again.');
      return;
    }

    toast.success('Registration successful! You can now explore the archive.');
    router.push('/');
  };

  return (
    <div className='max-w-lg mx-auto'>
      <form
        onSubmit={handleSubmit}
        className='space-y-4 glow-box'>
        <div>
          <label className='block mb-1 text-sm'>Email</label>
          <input
            type='email'
            className='input'
            value={user.email}
            readOnly
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Username*</label>
          <input
            type='text'
            className='input'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Password*</label>
          <input
            type='password'
            className='input'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Confirm Password*</label>
          <input
            type='password'
            className='input'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button
          type='submit'
          className='glow-button'>
          Register as Supporter
        </button>
      </form>
      <p className='mt-4 text-sm text-gray-600'>
        Note: As a supporter, you can browse and save your favorite events.
      </p>
    </div>
  );
}
