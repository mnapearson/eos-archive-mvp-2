'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import markerColors from '@/lib/markerColors';
import CityPicker from '@/components/CityPicker';
import toast from 'react-hot-toast';

const SPACE_TYPES = Object.keys(markerColors);

function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
}

export default function SpaceSignUpPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Space info fields
  const [spaceName, setSpaceName] = useState('');
  // Instead of a plain input, we use a combobox for the space type.
  const [spaceType, setSpaceType] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState({
    city: '',
    displayName: '',
    countryCode: '',
  });

  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');

  // User account fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLeico, setIsLeico] = useState(false);
  const [done, setDone] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    // 1. Combine address fields for geocoding — done before signUp() so the
    // resolved coordinates can be included in what we stash to localStorage.
    const cityName =
      city.city?.trim() || (city.displayName?.split(',')[0] || '').trim();

    if (!cityName) {
      toast.error('Please select your city.');
      return;
    }

    const fullAddress = `${address}, ${cityName}`;
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

    const registrationPayload = {
      spaceName,
      spaceType,
      cityName,
      address,
      description,
      website,
      isLeico,
      latitude,
      longitude,
    };

    // 2. Stash the space details before creating the account. If Supabase
    // requires email confirmation, no session exists yet, so the
    // registration call below can't run until the person confirms and
    // /spaces/signup/complete picks this back up. Never persist the
    // password.
    //
    // Known limitation: this only survives in the browser the person signed
    // up in. Confirming from a different browser/device loses it (they'd
    // see the "please re-submit" message on /spaces/signup/complete). A
    // server-side pending-registration table would survive that, but is a
    // bigger change — worth revisiting if this turns out to matter in
    // practice.
    try {
      localStorage.setItem(
        'pendingSpaceRegistration',
        JSON.stringify(registrationPayload)
      );
    } catch (err) {
      console.error('Unable to persist pending space registration:', err);
    }

    // 3. Create user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: { account_type: 'space', username: spaceName },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      // Confirmation required — pendingSpaceRegistration stays in storage
      // for /spaces/signup/complete to pick up once they confirm.
      setAwaitingConfirmation(true);
      setDone(true);
      return;
    }

    // 4. No confirmation required — session exists immediately, so
    // register the space right now.
    const registerRes = await fetch('/api/spaces/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(registrationPayload),
    });
    if (!registerRes.ok) {
      const { error: spaceError } = await registerRes.json();
      toast.error(spaceError || 'Error creating space record. Please try again.');
      return;
    }

    try {
      localStorage.removeItem('pendingSpaceRegistration');
    } catch {
      // Ignore — non-fatal, worst case a stale entry sits unused.
    }

    setDone(true);
  };

  if (done) {
    return (
      <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
        <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
          <header className='space-y-4'>
            <span className='ea-label ea-label--muted'>
              {awaitingConfirmation ? 'Almost there' : 'Registration received'}
            </span>
            <h1 className='quick-view__title text-balance'>Check your email</h1>
          </header>
          <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:px-12 sm:py-12'>
            <div className='space-y-6 max-w-lg'>
              {awaitingConfirmation ? (
                <p className='text-sm leading-relaxed text-[var(--foreground)]/75 sm:text-base'>
                  We sent a confirmation link to{' '}
                  <span className='text-[var(--foreground)] font-medium'>{email}</span>.
                  Click it to activate your account and finish submitting your space
                  — we&apos;ve saved your details in this browser, so you won&apos;t
                  need to re-enter anything.
                </p>
              ) : (
                <p className='text-sm leading-relaxed text-[var(--foreground)]/75 sm:text-base'>
                  Your space has been submitted and is pending review. We sent a confirmation link to{' '}
                  <span className='text-[var(--foreground)] font-medium'>{email}</span>.
                  Click it to verify your address and activate your account.
                </p>
              )}
              <p className='text-xs leading-relaxed text-[var(--foreground)]/50 uppercase tracking-[0.2em]'>
                The link expires after 24 hours. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
        <header className='space-y-4'>
          <span className='ea-label ea-label--muted'>Space Onboarding</span>
          <h1 className='quick-view__title text-balance'>
            Register your space with the archive
          </h1>
          <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70 sm:text-base'>
            Share your venue details to access the eos archive dashboard. Once
            submitted, you'll be able to upload imagery, publish events, and
            collaborate with the community across the archive.
          </p>
        </header>

        <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/90 px-6 py-8 shadow-[0_26px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:px-12 sm:py-12'>
          <form
            onSubmit={handleSignUp}
            className='mt-10 space-y-10'>
            <fieldset className='space-y-6'>
              <legend className='ea-label ea-label--muted'>
                Space profile
              </legend>

              <div className='space-y-2'>
                <label
                  htmlFor='space-name'
                  className='ea-label ea-label--muted'>
                  Space name*
                </label>
                <input
                  id='space-name'
                  type='text'
                  data-testid='space-signup-name'
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
                  data-testid='space-signup-address'
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
                  <CityPicker
                    id='space-city'
                    data-testid='space-signup-city'
                    value={city}
                    onChange={setCity}
                    required
                  />
                </div>

                <div className='flex-1 space-y-2'>
                  <label
                    htmlFor='space-type'
                    className='ea-label ea-label--muted'>
                    Space type*
                  </label>
                  <select
                    id='space-type'
                    data-testid='space-signup-type'
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
                  data-testid='space-signup-email'
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
                    data-testid='space-signup-password'
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
                data-testid='space-signup-submit'
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
