'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Spinner from '@/components/Spinner';
import EventSubmissionForm from '@/components/EventSubmissionForm';
import SpaceImageUpload from '@/components/SpaceImageUpload';

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

  // ———————————————————————————————————————————
  // 1) Decide how to fetch the space:
  //    - If we have no space yet, fetch by user_id.
  //    - If we do have a space, fetch by space.id
  //      so we always retrieve the same row after updates.
  // ———————————————————————————————————————————
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

  // ———————————————————————————————————————————
  // 2) On first mount, fetch the space (by user_id).
  // ———————————————————————————————————————————
  useEffect(() => {
    fetchSpaceRecord(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ———————————————————————————————————————————
  // 3) Handle saving changes
  // ———————————————————————————————————————————
  const handleSave = async () => {
    setUpdateError(null);
    setLoading(true);

    // Make sure we do NOT overwrite user_id:
    // only update website & description
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

    // If successful, store the updated record in state
    setSpace(data);
    setIsEditing(false);

    // Optionally re‐fetch to confirm
    // (Now that we have space.id, we can fetch by ID.)
    fetchSpaceRecord(data);
  };

  // ———————————————————————————————————————————
  // 4) Handle cancel
  // ———————————————————————————————————————————
  const handleCancel = () => {
    setFormValues({
      website: space.website || '',
      description: space.description || '',
    });
    setIsEditing(false);
    setUpdateError(null);
  };

  // ———————————————————————————————————————————
  // 5) Render
  // ———————————————————————————————————————————
  if (loading) {
    return <Spinner />;
  }

  if (!space) {
    // Means we tried to fetch by user_id or space.id
    // but found nothing
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
    <div className='max-w-lg mx-auto'>
      {/* Display the space image if it exists */}
      {space.image_url && (
        <div className='mb-4'>
          <img
            src={space.image_url}
            alt={space.name}
            className='w-full object-cover rounded-md'
          />
        </div>
      )}

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
                className='w-full border border-[var(--foreground)] p-2 rounded bg-transparent text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]'
                placeholder='https://example.com'
              />
            </div>
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
                className='w-full border border-[var(--foreground)] p-2 rounded bg-transparent text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]'
                rows={3}
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
              <p className='mb-2 text-sm text-gray-500'>No website provided.</p>
            )}
            {space.description ? (
              <p className='mb-2 text-sm'>{space.description}</p>
            ) : (
              <p className='mb-2 text-sm text-gray-500'>
                No description provided.
              </p>
            )}
            <div className='flex mt-10 mx-auto gap-4'>
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

      <div className='mb-2'>
        {space && <SpaceImageUpload spaceId={space.id} />}
        {updateError && (
          <p className='text-red-500 text-sm mb-2'>{updateError}</p>
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
    </div>
  );
}
