'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Toaster, toast } from 'react-hot-toast';
import Spinner from '@/components/Spinner';
import SpaceRegistrationForm from '@/components/SpaceRegistrationForm';
import OrganizerRegistrationForm from '@/components/OrganizerRegistrationForm';
import SupporterRegistrationForm from '@/components/SupporterRegistrationForm';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Show error toast if role is invalid after loading
  useEffect(() => {
    if (!loading) {
      const valid = ['space', 'organizer', 'supporter'];
      if (!valid.includes(role)) {
        toast.error('Invalid signup role. Please use a valid invite link.');
      }
    }
  }, [loading, role]);

  useEffect(() => {
    async function init() {
      // 1) If this URL has magic-link tokens, establish a session from them
      if (
        typeof window !== 'undefined' &&
        window.location.hash.includes('access_token')
      ) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          // setSession will store cookies for subsequent calls
          await supabase.auth.setSession({ access_token, refresh_token });
          // remove tokens from URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search
          );
        }
      }

      // 2) Now read the session (cookie) that was just set
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error('Session not found. Redirecting to login.');
        router.replace('/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    init();
  }, [supabase, router]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <Toaster position='bottom-center' />
      {/* Branch to the correct registration form */}
      {role === 'space' && <SpaceRegistrationForm user={user} />}
      {role === 'organizer' && <OrganizerRegistrationForm user={user} />}
      {role === 'supporter' && <SupporterRegistrationForm user={user} />}

      {/* If role is invalid or missing */}
      {!['space', 'organizer', 'supporter'].includes(role) && (
        <div className='max-w-md mx-auto p-6 text-center'>
          <p className='text-red-500'>
            Invalid signup role. Please use the invite link provided to you.
          </p>
        </div>
      )}
    </>
  );
}
