'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import markerColors from '@/lib/markerColors';
import { allowedCities } from '@/lib/cities';
import toast from 'react-hot-toast';

const SPACE_TYPES = Object.keys(markerColors);

export default function SpaceSignUpPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Space info fields
  const [spaceName, setSpaceName] = useState('');
  // Instead of a plain input, we use a combobox for the space type.
  const [spaceType, setSpaceType] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  // User account fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    // 1. Create user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const userId = data.user?.id;
    if (!userId) {
      toast.error('Please check your email to confirm your account.');
      return;
    }

    // 2. Combine address fields for geocoding.
    const fullAddress = `${address}, ${city}, ${zipcode}`;
    let latitude = null;
    let longitude = null;
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const geoRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          fullAddress
        )}.json?access_token=${token}`
      );
      const geoData = await geoRes.json();
      if (geoData.features && geoData.features.length > 0) {
        [longitude, latitude] = geoData.features[0].center;
      } else {
        toast.error(
          'Unable to geocode the address. Please check your address.'
        );
        return;
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      toast.error('Error during geocoding. Please try again.');
      return;
    }

    // 3. Insert the space record (with status set to 'pending').
    const { error: spaceError } = await supabase.from('spaces').insert([
      {
        user_id: userId,
        name: spaceName,
        type: spaceType, // Save the space type (either selected or new)
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
      console.error('Error inserting space:', spaceError);
      toast.error('Error creating space record. Please try again.');
      return;
    }

    // 4. Update the profiles table with role and username.
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'space', username: spaceName });
    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    toast.success(
      'You have successfully registered the space in the archive. Please upload a space image and submit your first event.'
    );

    // 5. Redirect to a confirmation page instructing the user to confirm their email.
    router.push('/spaces/admin');
  };

  return (
    <div className='max-w-lg mx-auto'>
      <form
        onSubmit={handleSignUp}
        className='space-y-4 glow-box lowercase'>
        {/* Space Information Section */}
        <div>
          <label className='block my-1 text-sm'>Space Name*</label>
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
          />
        </div>
        <div className='flex gap-2'>
          <div className='flex-1'>
            <label className='block mb-1 text-sm'>City*</label>
            <select
              className='input'
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required>
              <option
                value=''
                disabled>
                Select your city
              </option>
              {allowedCities.map((c) => (
                <option
                  key={c}
                  value={c}>
                  {c}
                </option>
              ))}
            </select>
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
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

        {/* User Account Section */}

        <div>
          <label className='block mb-1 text-sm'>Email Address*</label>
          <input
            type='email'
            className='input'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          Submit
        </button>
      </form>
      <p className='mt-4 text-sm text-gray-600'>
        Note: Once you submit your registration, you will be able to upload a
        space image and submit events in your dashboard.
      </p>
    </div>
  );
}
