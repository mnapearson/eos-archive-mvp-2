'use client';

import { useState } from 'react';
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

  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  // User account fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLeico, setIsLeico] = useState(false);

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
    const fullAddress = `${address}, ${city}`;
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

        description,
        website,
        leico: isLeico,
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
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='pointer-events-none absolute inset-x-0 top-[-10%] z-0 h-[120%] w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_70%)]' />

      <div className='relative z-10 mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
        <header className='space-y-4'>
          <span className='ea-label ea-label--muted'>Partner Space Onboarding</span>
          <h1 className='quick-view__title text-balance'>
            Register your space with the archive
          </h1>
          <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70 sm:text-base'>
            Share your venue details to access the EOS partner dashboard. Once approved, you'll be able to upload imagery, publish events, and collaborate with the community across the archive.
          </p>
        </header>

        <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/90 px-6 py-10 shadow-[0_26px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:px-12 sm:py-14'>
          <form
          onSubmit={handleSignUp}
          className='mt-10 space-y-10'>
          <fieldset className='space-y-6'>
            <legend className='ea-label ea-label--muted'>Space profile</legend>

            <div className='space-y-2'>
              <label
                htmlFor='space-name'
                className='ea-label ea-label--muted'>
                Space name*
              </label>
              <input
                id='space-name'
                type='text'
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='space-address'
                className='ea-label ea-label--muted'>
                Street address*
              </label>
              <input
                id='space-address'
                type='text'
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className='flex flex-col gap-4 sm:flex-row'>
              <div className='flex-1 space-y-2'>
                <label
                  htmlFor='space-city'
                  className='ea-label ea-label--muted'>
                  City*
                </label>
                <select
                  id='space-city'
                  className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
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

              <div className='flex-1 space-y-2'>
                <label
                  htmlFor='space-type'
                  className='ea-label ea-label--muted'>
                  Space type*
                </label>
                <select
                  id='space-type'
                  className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                  value={spaceType}
                  onChange={(e) => setSpaceType(e.target.value)}
                  required>
                  <option
                    value=''
                    disabled>
                    Select a type
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
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='space-description'
                className='ea-label ea-label--muted'>
                Description
              </label>
              <textarea
                id='space-description'
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder='Tell us about the space, programming, and community.'
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='space-website'
                className='ea-label ea-label--muted'>
                Website
              </label>
              <input
                id='space-website'
                type='url'
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder='https://your-space.example'
              />
            </div>

            <label className='flex items-center gap-3 rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/75 px-4 py-3 text-sm leading-relaxed text-[var(--foreground)]/75'>
              <input
                id='isLeico'
                type='checkbox'
                checked={isLeico}
                onChange={(e) => setIsLeico(e.target.checked)}
                className='h-4 w-4 rounded border-[var(--foreground)]/40 bg-transparent text-[var(--foreground)] focus:ring-[var(--foreground)]/45'
              />
              This is a LEICO space
            </label>
          </fieldset>

          <fieldset className='space-y-6'>
            <div className='space-y-2'>
              <label
                htmlFor='account-email'
                className='ea-label ea-label--muted'>
                Email*
              </label>
              <input
                id='account-email'
                type='email'
                className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete='email'
                required
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <label
                  htmlFor='account-password'
                  className='ea-label ea-label--muted'>
                  Password*
                </label>
                <input
                  id='account-password'
                  type='password'
                  className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete='new-password'
                  required
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='account-password-confirm'
                  className='ea-label ea-label--muted'>
                  Confirm password*
                </label>
                <input
                  id='account-password-confirm'
                  type='password'
                  className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete='new-password'
                  required
                />
              </div>
            </div>
          </fieldset>

          <footer className='space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0'>
            <p className='text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/50 sm:max-w-sm'>
              After submitting, you can upload imagery and publish events.
            </p>
            <button
              type='submit'
              className='nav-action nav-cta !inline-flex h-11 w-full justify-center px-8 text-[12px] uppercase tracking-[0.32em] shadow-[0_18px_48px_rgba(0,0,0,0.28)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'>
              Submit space
            </button>
          </footer>
          </form>
        </section>
      </div>
    </main>
  );
}
