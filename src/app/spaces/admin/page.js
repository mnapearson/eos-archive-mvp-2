'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Spinner from '@/components/Spinner';

export default function SpaceAdminDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpace() {
      setLoading(true);
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // If not logged in, redirect to login page
        router.push('/login');
        return;
      }
      const userId = session.user.id;
      // Fetch the space record associated with this user
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) {
        console.error('Error fetching space:', error);
      } else {
        setSpace(data);
      }
      setLoading(false);
    }
    fetchSpace();
  }, [router, supabase]);

  if (loading) {
    return <Spinner />;
  }

  if (!space) {
    return (
      <div className='max-w-md mx-auto p-4'>
        <p>No space record found for your account.</p>
        <Link
          href='/spaces/signup'
          className='underline'>
          Create your space page
        </Link>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold'>account info</h1>{' '}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}>
          LOGOUT
        </button>
      </div>

      <div className='border p-4 rounded-md shadow'>
        <h2 className='text-xl font-semibold'>{space.name}</h2>
        <p className='text-sm'>
          {space.address}, {space.city} {space.zipcode}
        </p>
        {space.website && (
          <p className='mt-1'>
            <a
              href={space.website}
              target='_blank'
              rel='noopener noreferrer'
              className='underline'>
              Visit Website
            </a>
          </p>
        )}
        {space.description && (
          <p className='mt-2 text-sm'>{space.description}</p>
        )}
      </div>

      <div className='mt-6'>
        <h3 className='text-lg font-semibold'>Your Events</h3>
        <p className='text-sm'>
          <Link
            href='/spaces/admin/events'
            className='underline'>
            Manage Your Events
          </Link>
        </p>
      </div>

      <div className='mt-6'>
        <h3 className='text-lg font-semibold'>Edit Your Space Details</h3>
        <p className='text-sm'>
          <Link
            href='/spaces/admin/edit'
            className='underline'>
            Edit Space Page
          </Link>
        </p>
      </div>
    </div>
  );
}
