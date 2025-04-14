'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Spinner from '@/components/Spinner';
import EventSubmissionForm from '@/components/EventSubmissionForm';
import SpaceImageUpload from '@/components/SpaceImageUpload';
import AdminEventsManager from '@/components/AdminEventsManager';

export default function SpaceAdminDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Toggle edit mode
  const [isEditing, setIsEditing] = useState(false);
  // Form fields for website & description
  const [formValues, setFormValues] = useState({
    website: '',
    description: '',
  });
  const [updateError, setUpdateError] = useState(null);

  // Helper function to check if a URL is valid
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  };

  async function fetchSpaceRecord(currentSpace) {
    setLoading(true);
    setUpdateError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const userId = session.user.id;

    let query = supabase.from('spaces').select('*').single();

    if (currentSpace?.id) {
      // Already have a space, so fetch by the known ID
      query = query.eq('id', currentSpace.id);
    } else {
      // No known space yet, fetch by user_id
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching space:', error);
      setSpace(null);
    } else if (data) {
      setSpace(data);
      // Keep form values in sync
      setFormValues({
        website: data.website || '',
        description: data.description || '',
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSpaceRecord(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setUpdateError(null);
    // Validate website URL (if provided)
    if (formValues.website && !isValidUrl(formValues.website)) {
      setUpdateError(
        'Please enter a valid website URL starting with http:// or https://'
      );
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('spaces')
      .update({
        website: formValues.website,
        description: formValues.description,
      })
      .eq('id', space.id)
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error updating space details', error);
      setUpdateError('Failed to update details. Please try again.');
      return;
    }

    setSpace(data);
    setIsEditing(false);
    fetchSpaceRecord(data);
  };

  const handleCancel = () => {
    setFormValues({
      website: space.website || '',
      description: space.description || '',
    });
    setIsEditing(false);
    setUpdateError(null);
  };

  if (loading) {
    return <Spinner />;
  }

  if (!space) {
    return (
      <div className='max-w-lg mx-auto'>
        <p>No space record found for your account.</p>
        <Link
          href='/spaces/signup'
          className='underline'>
          Register to become a member of eos archive.
        </Link>
      </div>
    );
  }

  return (
    <div className='mx-auto'>
      <div className='flex flex-col md:flex-row gap-8'>
        {/* Left Column: Space details */}
        <div className='flex-1 '>
          <div className='border p-4 rounded-md shadow mb-6 glow-box'>
            <h2 className='font-semibold text-lg'>{space.name}</h2>
            <p className='text-sm italic'>{space.type}</p>
            <p className='text-sm mb-2'>
              {space.address}, {space.city} {space.zipcode}
            </p>

            {isEditing ? (
              <>
                <div className='mb-2'>
                  <label className='block text-sm font-semibold mb-1'>
                    Website
                  </label>
                  <input
                    type='url'
                    value={formValues.website}
                    onChange={(e) =>
                      setFormValues({ ...formValues, website: e.target.value })
                    }
                    className='input'
                    placeholder='https://example.com'
                  />
                </div>
                {updateError && (
                  <p className='text-red-500 text-sm mb-2'>{updateError}</p>
                )}
                <div className='mb-2'>
                  <label className='block text-sm font-semibold mb-1'>
                    Description
                  </label>
                  <textarea
                    value={formValues.description}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        description: e.target.value,
                      })
                    }
                    className='input'
                    rows={4}
                    placeholder='Describe your space...'
                  />
                </div>
                <div className='flex justify-between mt-4'>
                  <button
                    onClick={handleSave}
                    className='glow-button'>
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className='glow-button'>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {space.website ? (
                  <p className='mb-2'>
                    <a
                      href={space.website}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm text-[var(--accent)] underline hover:text-[var(--foreground)] transition'>
                      VISIT WEBSITE
                    </a>
                  </p>
                ) : (
                  <p className='mb-2 text-sm text-gray-500'>
                    No website provided.
                  </p>
                )}
                {space.description ? (
                  <p className='mb-2 text-sm'>{space.description}</p>
                ) : (
                  <p className='mb-2 text-sm text-gray-500'>
                    No description provided.
                  </p>
                )}
                <div className='flex gap-4 justify-center mt-4'>
                  <button
                    onClick={() => setIsEditing(true)}
                    className='glow-button'>
                    Edit details
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.push('/login');
                    }}
                    className='glow-button'>
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
          {space.image_url && (
            <div className='mb-4'>
              <img
                src={space.image_url}
                alt={space.name}
                className='w-full object-cover rounded-md'
              />
            </div>
          )}
          <div className='mb-2'>
            {space && <SpaceImageUpload spaceId={space.id} />}
            {updateError && (
              <p className='text-red-500 text-sm mb-2'>{updateError}</p>
            )}
          </div>
        </div>

        {/* Right Column: Event submission */}
        <div className='flex-1'>
          <div className='mb-6'>
            <EventSubmissionForm spaceId={space.id} />
          </div>
          <div className='mb-6'>
            <AdminEventsManager spaceId={space.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
