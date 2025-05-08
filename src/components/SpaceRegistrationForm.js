'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import markerColors from '@/lib/markerColors';
import toast from 'react-hot-toast';

const SPACE_TYPES = Object.keys(markerColors);

export default function SpaceRegistrationForm({ user }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Space info fields
  const [spaceName, setSpaceName] = useState('');
  const [spaceType, setSpaceType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  // Account fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    // 1. Update user password
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      toast.error(authError.message);
      return;
    }

    const userId = user.id;

    // 2. Geocode address
    const fullAddress = `${address}, ${city}, ${zipcode}`;
    let latitude = null,
      longitude = null;
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          fullAddress
        )}.json?access_token=${token}`
      );
      const data = await res.json();
      if (data.features?.length) {
        [longitude, latitude] = data.features[0].center;
      } else {
        toast.error('Unable to geocode the address. Please check it.');
        return;
      }
    } catch (err) {
      console.error(err);
      toast.error('Error during geocoding. Please try again.');
      return;
    }

    // 3. Insert space record
    const { error: spaceError } = await supabase.from('spaces').insert([
      {
        user_id: userId,
        name: spaceName,
        type: spaceType,
        city,
        address,
        zipcode,
        description,
        website,
        latitude,
        longitude,
        status: 'pending',
      },
    ]);
    if (spaceError) {
      console.error(spaceError);
      toast.error('Error creating space. Please try again.');
      return;
    }

    // 4. Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'space', username: spaceName });
    if (profileError) {
      console.error(profileError);
    }

    toast.success(
      'You have successfully registered the space in the archive. Please upload a space image and submit your first event.'
    );

    // 5. Redirect to space admin
    router.push('/spaces/admin');
  };

  return (
    <div className='max-w-lg mx-auto'>
      <form
        onSubmit={handleSubmit}
        className='space-y-4 glow-box'>
        {/* Space Info */}
        <div>
          <label className='block mb-1 text-sm'>Space Name*</label>
          <input
            type='text'
            className='input'
            value={spaceName}
            onChange={(e) => setSpaceName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Space Type*</label>
          <select
            className='input'
            value={spaceType}
            onChange={(e) => setSpaceType(e.target.value)}
            required>
            <option
              value=''
              disabled>
              Select a space type
            </option>
            {SPACE_TYPES.map((type) => (
              <option
                key={type}
                value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className='block mb-1 text-sm'>Street Address*</label>
          <input
            type='text'
            className='input'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className='flex gap-2'>
          <div className='flex-1'>
            <label className='block mb-1 text-sm'>City*</label>
            <input
              type='text'
              className='input'
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div className='flex-1'>
            <label className='block mb-1 text-sm'>ZIP Code*</label>
            <input
              type='text'
              className='input'
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              required
            />
          </div>
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
          Register Space
        </button>
      </form>
      <p className='mt-4 text-sm text-gray-600'>
        Note: After registering, you can upload a space image and submit events
        in your dashboard.
      </p>
    </div>
  );
}
