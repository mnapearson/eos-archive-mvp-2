'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Spinner from '@/components/Spinner';
import EventSubmissionForm from '@/components/EventSubmissionForm';
import SpaceImageUpload from '@/components/SpaceImageUpload';
import SpaceListItem from '@/components/SpaceListItem';
import AdminEventsManager from '@/components/AdminEventsManager';
import { toast } from 'react-hot-toast';

export default function SpaceAdminDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    website: '',
    description: '',
  });
  const [activeTab, setActiveTab] = useState('details');

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
      query = query.eq('id', currentSpace.id);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching space:', error);
      setSpace(null);
    } else if (data) {
      setSpace(data);
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
    if (formValues.website && !isValidUrl(formValues.website)) {
      toast.error(
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
      return;
    }

    setSpace(data);
    setIsEditing(false);
    fetchSpaceRecord(data);
    toast.success('Space details updated successfully');
  };

  const handleCancel = () => {
    setFormValues({
      website: space.website || '',
      description: space.description || '',
    });
    setIsEditing(false);
    setUpdateError(null);
  };

  const tabOptions = useMemo(
    () => [
      { id: 'details', label: 'Space details' },
      { id: 'events', label: 'Submit events' },
      { id: 'archive', label: 'Archive' },
    ],
    []
  );

  if (loading) {
    return <Spinner />;
  }

  if (!space) {
    return (
      <div className='mx-auto max-w-[92vw] py-16 text-center text-sm text-[var(--foreground)]/70 lg:max-w-5xl'>
        No space record found for your account. If you believe this is an
        error, please contact{' '}
        <a
          href='mailto:hello@eosarchive.app'
          className='underline hover:text-[var(--foreground)]'>
          hello@eosarchive.app
        </a>
        .
      </div>
    );
  }

  return (
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='mx-auto w-full max-w-[92vw] space-y-12 py-10 lg:max-w-5xl xl:max-w-6xl'>
        <header className='space-y-4'>
          <span className='ea-label ea-label--muted'>Space dashboard</span>
          <h1 className='quick-view__title text-balance'>Manage {space.name}</h1>
          <p className='max-w-2xl text-sm leading-relaxed text-[var(--foreground)]/70 sm:text-base'>
            Update your venue profile, upload visuals, and publish upcoming
            events from a single workspace. Remember to keep details current so
            explorers know what&rsquo;s happening at your space.
          </p>
        </header>

        <nav className='flex flex-wrap gap-3 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/70'>
          {tabOptions.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type='button'
                onClick={() => setActiveTab(tab.id)}
                className={`nav-action !inline-flex h-10 px-4 transition ${
                  isActive
                    ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
                    : ''
                }`}>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === 'details' && (
          <section className='space-y-8 rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/92 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-10'>
            {isEditing ? (
              <div className='space-y-6 rounded-3xl border border-[var(--foreground)]/16 bg-[var(--background)]/75 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.18)] sm:p-8'>
                <div className='space-y-2'>
                  <label className='ea-label ea-label--muted' htmlFor='details-website'>
                    Website
                  </label>
                  <input
                    id='details-website'
                    type='url'
                    value={formValues.website}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        website: e.target.value,
                      })
                    }
                    className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                    placeholder='https://example.com'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='ea-label ea-label--muted' htmlFor='details-description'>
                    Description
                  </label>
                  <textarea
                    id='details-description'
                    value={formValues.description}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        description: e.target.value,
                      })
                    }
                    className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                    rows={4}
                    placeholder='Describe your space...'
                  />
                </div>
                <div className='flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4'>
                  <button
                    onClick={handleSave}
                    className='nav-action nav-cta !inline-flex h-10 w-full justify-center px-6 text-[11px] uppercase tracking-[0.32em] shadow-[0_18px_40px_rgba(0,0,0,0.24)] disabled:opacity-60 sm:w-auto'>
                    Save changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className='nav-action !inline-flex h-10 w-full justify-center px-6 text-[11px] uppercase tracking-[0.28em] hover:border-[var(--foreground)]/35 sm:w-auto'>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <SpaceListItem
                space={space}
                variant='compact'
                surface='overlay'
                showActions={false}
                className='border border-[var(--foreground)]/16 bg-[var(--background)]/75 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.18)] sm:p-8'
              />
            )}

            {!isEditing && (
              <div>
                <button
                  onClick={() => setIsEditing(true)}
                  className='nav-action nav-cta !inline-flex h-10 w-full justify-center px-6 text-[11px] uppercase tracking-[0.32em] shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:w-auto'>
                  Edit details
                </button>
              </div>
            )}

            <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
              <SpaceImageUpload spaceId={space.id} />
              {space.image_url && (
                <img
                  src={space.image_url}
                  alt={space.name}
                  className='w-full rounded-3xl object-cover shadow-[0_18px_48px_rgba(0,0,0,0.18)]'
                />
              )}
            </div>
          </section>
        )}

        {activeTab === 'events' && (
          <section className='space-y-8 rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/92 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-10'>
            <EventSubmissionForm spaceId={space.id} />
          </section>
        )}

        {activeTab === 'archive' && (
          <section className='space-y-4 rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/92 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-10'>
            <h3 className='text-lg font-semibold tracking-tight text-[var(--foreground)]'>
              Archived events
            </h3>
            <AdminEventsManager
              spaceId={space.id}
              filter='archive'
              editable={true}
              emptyMessage='No archived events yet for this space.'
            />
          </section>
        )}
        <div className='flex justify-end border-t border-[var(--foreground)]/12 pt-6'>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className='nav-action !inline-flex h-10 w-full justify-center px-6 text-[11px] uppercase tracking-[0.28em] hover:border-[var(--foreground)]/35 sm:w-auto'>
            Disconnect
          </button>
        </div>
      </div>
    </main>
  );
}
