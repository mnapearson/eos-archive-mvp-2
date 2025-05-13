'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Spinner from '@/components/Spinner';
import EventSubmissionForm from '@/components/EventSubmissionForm';
import AdminEventsManager from '@/components/AdminEventsManager';
import { toast } from 'react-hot-toast';

export default function OrganizerAdminDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({ website: '', bio: '' });
  const [updateError, setUpdateError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  // Fetch organizer record by user_id
  async function fetchOrganizerRecord() {
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
      .from('organizers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching organizer:', error);
      setOrganizer(null);
    } else if (data) {
      // got an organizer record
      setOrganizer(data);
      setFormValues({
        website: data.website || '',
        bio: data.bio || '',
      });
    } else {
      // no organizer record found
      setOrganizer(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchOrganizerRecord();
  }, []);

  const handleSave = async () => {
    setUpdateError(null);
    setLoading(true);
    const { data, error } = await supabase
      .from('organizers')
      .update({
        website: formValues.website,
        bio: formValues.bio,
      })
      .eq('id', organizer.id)
      .select()
      .single();
    setLoading(false);
    if (error) {
      console.error('Error updating organizer details', error);
      setUpdateError('Failed to update details. Please try again.');
      return;
    }
    setOrganizer(data);
    setIsEditing(false);
    toast.success('Organizer details updated successfully');
    fetchOrganizerRecord();
  };

  const handleCancel = () => {
    setFormValues({
      website: organizer.website || '',
      bio: organizer.bio || '',
    });
    setIsEditing(false);
    setUpdateError(null);
  };

  if (loading) {
    return <Spinner />;
  }

  if (!organizer) {
    return (
      <div className='max-w-lg mx-auto'>
        <p>No organizer record found for your account.</p>
        <p>Please contact admin to register as an organizer.</p>
      </div>
    );
  }

  return (
    <div className='mx-auto'>
      <div className='tabs flex gap-2 mb-4'>
        <button
          className='button'
          onClick={() => setActiveTab('details')}>
          Profile
        </button>
        <button
          className='button'
          onClick={() => setActiveTab('events')}>
          Submit Events
        </button>
        <button
          className='button'
          onClick={() => setActiveTab('archive')}>
          Archive
        </button>
      </div>

      {activeTab === 'details' && (
        <div className='border p-4 rounded-md shadow glow-box'>
          <h2 className='font-semibold text-lg'>{organizer.name}</h2>
          {isEditing ? (
            <>
              <div className='mb-4'>
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
              <div className='mb-4'>
                <label className='block text-sm font-semibold mb-1'>Bio</label>
                <textarea
                  rows={4}
                  value={formValues.bio}
                  onChange={(e) =>
                    setFormValues({ ...formValues, bio: e.target.value })
                  }
                  className='input'
                  placeholder='Tell us about yourself...'
                />
              </div>
              {updateError && (
                <p className='text-red-500 text-sm mb-2'>{updateError}</p>
              )}
              <div className='flex gap-2'>
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
              {organizer.website ? (
                <p className='mb-2'>
                  <a
                    href={organizer.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-[var(--accent)] underline'>
                    Visit Website
                  </a>
                </p>
              ) : (
                <p className='text-sm text-gray-500 mb-2'>
                  No website provided.
                </p>
              )}
              {organizer.bio ? (
                <p className='text-sm mb-4'>{organizer.bio}</p>
              ) : (
                <p className='text-sm text-gray-500 mb-4'>No bio provided.</p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className='glow-button'>
                Edit Profile
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className='space-y-8'>
          <EventSubmissionForm />
        </div>
      )}

      {activeTab === 'archive' && (
        <div className='mt-4'>
          <h3 className='text-lg font-bold mb-2'>Your Archived Events</h3>
          <AdminEventsManager
            filter='approved'
            editable={true}
            emptyMessage='No events found.'
          />
        </div>
      )}
    </div>
  );
}
