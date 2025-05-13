'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

export default function OrganizerRegistrationForm({ user }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Organizer info fields
  const [organizerName, setOrganizerName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  // Account fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate password match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    // 2. Update user password
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      toast.error(authError.message);
      return;
    }

    const userId = user.id;

    // 3. Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'organizer', username: organizerName });
    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // 4. Insert into organizers table
    const { error: orgError } = await supabase.from('organizers').insert([
      {
        user_id: userId,
        name: organizerName,
        website,
        bio: description,
      },
    ]);
    if (orgError) {
      console.error('Error inserting organizer:', orgError);
      toast.error('Error registering organizer. Please try again.');
      return;
    }

    // 5. Success
    toast.success(
      'You have successfully registered as an organizer. You can now submit events under your profile.'
    );

    // 6. Redirect to organizer dashboard
    router.push('/organizers/admin');
  };

  return (
    <div className='max-w-lg mx-auto'>
      <form
        onSubmit={handleSubmit}
        className='space-y-4 glow-box'>
        <div>
          <label className='block mb-1 text-sm'>Organizer Name*</label>
          <input
            type='text'
            className='input'
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Description</label>
          <textarea
            className='input'
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Website</label>
          <input
            type='url'
            className='input'
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {/* Account Info */}
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
          Register Organizer
        </button>
      </form>
      <p className='mt-4 text-sm text-gray-600'>
        Note: After registering, you can upload your events in the dashboard.
      </p>
    </div>
  );
}
