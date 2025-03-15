'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SpaceSignUpPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Space info fields
  const [spaceName, setSpaceName] = useState('');
  const [address, setAddress] = useState(''); // Street address
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  // User account fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // 1. Create user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    const userId = data.user?.id;
    if (!userId) {
      setErrorMsg('Please check your email to confirm your account.');
      return;
    }

    // 2. Combine address fields for geocoding:
    // Example: "Kotzschauer Str. 2, Leipzig, 04109"
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
        // Mapbox returns [longitude, latitude]
        [longitude, latitude] = geoData.features[0].center;
      } else {
        setErrorMsg(
          'Unable to geocode the address. Please check your address.'
        );
        return;
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setErrorMsg('Error during geocoding. Please try again.');
      return;
    }

    // 3. Insert the space record with the geocoded coordinates.
    const { error: spaceError } = await supabase.from('spaces').insert([
      {
        user_id: userId,
        name: spaceName,
        city,
        address, // store street address separately
        zipcode,
        description,
        website,
        latitude,
        longitude,
      },
    ]);
    if (spaceError) {
      console.error('Error inserting space:', spaceError);
      setErrorMsg('Error creating space record. Please try again.');
      return;
    }

    // 4. Optionally update the profiles table to store the user's role as "space"
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'space' });
    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // 5. Redirect to the space admin page.
    router.push('/spaces/admin');
  };

  return (
    <div className='max-w-md mx-auto p-4'>
      <h1 className='text-xl font-bold mb-4'>Sign Up as a Space</h1>
      <form
        onSubmit={handleSignUp}
        className='space-y-4'>
        {/* Space Information Section */}
        <div>
          <label className='block mb-1 text-sm'>Space Name</label>
          <input
            type='text'
            className='border p-2 w-full'
            value={spaceName}
            onChange={(e) => setSpaceName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Street Address</label>
          <input
            type='text'
            className='border p-2 w-full'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder='e.g., Kotzschauer Str. 2'
            required
          />
        </div>
        <div className='flex gap-2'>
          <div className='flex-1'>
            <label className='block mb-1 text-sm'>City</label>
            <input
              type='text'
              className='border p-2 w-full'
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div className='flex-1'>
            <label className='block mb-1 text-sm'>ZIP Code</label>
            <input
              type='text'
              className='border p-2 w-full'
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              placeholder='e.g., 04109'
              required
            />
          </div>
        </div>
        <div>
          <label className='block mb-1 text-sm'>Description</label>
          <textarea
            className='border p-2 w-full'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className='block mb-1 text-sm'>Website</label>
          <input
            type='url'
            className='border p-2 w-full'
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <hr className='my-4' />

        {/* User Account Section */}
        <div>
          <label className='block mb-1 text-sm'>Email Address</label>
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
        <div>
          <label className='block mb-1 text-sm'>Confirm Password</label>
          <input
            type='password'
            className='border p-2 w-full'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {errorMsg && <p className='text-red-500 text-sm'>{errorMsg}</p>}

        <button
          type='submit'
          className='bg-[var(--foreground)] text-[var(--background)] px-4 py-2 rounded'>
          Create Account &amp; Space
        </button>
      </form>
    </div>
  );
}
