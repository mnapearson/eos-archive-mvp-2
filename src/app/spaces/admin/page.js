'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Spinner from '@/components/Spinner';
import EventSubmissionForm from '@/components/EventSubmissionForm';

export default function SpaceAdminDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpace() {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const userId = session.user.id;
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
        <h1 className='font-bold'>dashboard</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className='text-sm'>
          LOGOUT
        </button>
      </div>

      <div className='border p-4 rounded-md shadow mb-6'>
        <h2 className='font-semibold'>{space.name}</h2>
        <p className='text-xs italic'>{space.type}</p>
        <p className='text-sm mt-1'>
          {space.address}, {space.city} {space.zipcode}
        </p>
        {space.website && (
          <p className='mt-1'>
            <a
              href={space.website}
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm'>
              VISIT WEBSITE
            </a>
          </p>
        )}
        {space.description && (
          <p className='mt-2 text-sm'>{space.description}</p>
        )}
      </div>

      {/* Event Submission Form */}
      <div className='mb-6'>
        <EventSubmissionForm spaceId={space.id} />
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
