'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateRange } from '@/lib/date';
import toast from 'react-hot-toast';
import Spinner from '@/components/Spinner';
import EventFlyer from '@/components/EventFlyer';

export default function AccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  // Session and profile (role, display_name, bio, location) come from
  // AuthContext instead of this page's own getSession()/profiles fetch —
  // see AuthContext.js for why an independent auth-state read here was a
  // latent instance of the same race that hung /spaces/signup/complete.
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [status, setStatus] = useState('loading');
  const [savedEvents, setSavedEvents] = useState([]);
  const [savedSpaces, setSavedSpaces] = useState([]);
  const [visitedSpaces, setVisitedSpaces] = useState([]);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('saved');

  useEffect(() => {
    // Don't act on auth state until AuthContext has actually resolved it
    // one way or the other.
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Direct navigation / bookmark / back-button safety net — login and
    // signup already route by role, this just guards against landing here
    // with the wrong dashboard for the account. A missing profiles row
    // (profile is null — no matching row) deliberately does NOT redirect:
    // we don't actually know which dashboard is correct in that case, and
    // redirecting on a null role risks bouncing between /account and
    // /spaces/admin if both guards fired on the same undefined value.
    if (profile?.role === 'space') {
      router.replace('/spaces/admin');
      return;
    }

    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
    }

    async function load() {
      const [savedRes, savedSpacesRes, visitedSpacesRes] = await Promise.all([
        supabase.from('saved_events').select('event_id').eq('user_id', user.id),
        supabase.from('saved_spaces').select('space_id, created_at, spaces(id, name, city_name, city, type, image_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('space_visits').select('space_id, created_at, spaces(id, name, city_name, city, type, image_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (savedRes.data?.length > 0) {
        const ids = savedRes.data.map((r) => r.event_id);
        const { data: eventsData } = await supabase
          .from('events')
          // instagram_post_url deliberately left off this explicit column
          // list: an explicit .select() naming a column that doesn't exist
          // yet errors the whole query (confirmed live), unlike a plain
          // event.instagram_post_url property read on a select('*') row,
          // which is just undefined until the events table migration
          // lands. EventFlyer already treats it as optional either way.
          .select('id, title, start_date, end_date, start_time, end_time, image_url, flyer_image_url, category, spaces(id, name, city_name, city, category, type)')
          .in('id', ids);
        setSavedEvents(eventsData || []);
      } else {
        setSavedEvents([]);
      }

      setSavedSpaces(savedSpacesRes.data?.map((r) => r.spaces).filter(Boolean) || []);
      setVisitedSpaces(visitedSpacesRes.data?.map((r) => r.spaces).filter(Boolean) || []);

      setStatus('ready');
    }
    load();
  }, [supabase, router, user, profile, authLoading]);

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const up = [], pa = [];
    savedEvents.forEach((e) => {
      const d = new Date(e.start_date);
      (d >= today ? up : pa).push(e);
    });
    up.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    pa.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return { upcoming: up, past: pa };
  }, [savedEvents]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, display_name: displayName, bio, location });
    setSaving(false);
    if (error) { toast.error('Could not save changes.'); return; }
    toast.success('Profile updated.');
    await refreshProfile();
  };

  const handleChangePassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Password reset email sent. Check your inbox.');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (status === 'loading') {
    return (
      <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
        <div className='flex min-h-[40vh] items-center justify-center'><Spinner /></div>
      </main>
    );
  }

  const tabs = [
    { id: 'saved', label: 'Saved', count: savedEvents.length },
    { id: 'spaces', label: 'Spaces', count: savedSpaces.length },
    { id: 'visited', label: 'Visited', count: visitedSpaces.length },
    { id: 'profile', label: 'Profile', count: null },
  ];

  return (
    <main className='relative isolate min-h-[calc(100vh-72px)] bg-[var(--background)]'>
      <div className='mx-auto w-full max-w-[92vw] space-y-10 py-10 lg:max-w-5xl xl:max-w-6xl'>

        <header className='space-y-1'>
          <span className='ea-label ea-label--muted'>Member</span>
          <h1 className='quick-view__title text-balance'>
            {profile?.display_name || user?.email}
          </h1>
        </header>

        {/* Tabs */}
        <div className='flex gap-2 border-b border-[var(--foreground)]/10 pb-0'>
          {tabs.map((t) => (
            <button
              key={t.id}
              type='button'
              onClick={() => setTab(t.id)}
              className={`relative pb-3 text-[11px] uppercase tracking-[0.28em] transition-colors ${
                tab === t.id
                  ? 'text-[var(--foreground)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[var(--foreground)]'
                  : 'text-[var(--foreground)]/45 hover:text-[var(--foreground)]/70'
              } px-1 mr-4`}>
              {t.label}
              {t.count !== null && (
                <span className='ml-2 opacity-50'>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Saved events tab */}
        {tab === 'saved' && (
          <div className='space-y-8'>
            {savedEvents.length === 0 ? (
              <div className='rounded-[28px] border border-[var(--foreground)]/10 bg-[var(--background)]/70 px-8 py-12 text-center'>
                <p className='text-sm text-[var(--foreground)]/50 uppercase tracking-[0.2em]'>No saved events yet</p>
                <p className='mt-2 text-xs text-[var(--foreground)]/35'>Open any event and hit Save to add it here.</p>
                <Link href='/' className='nav-action mt-6 !inline-flex h-9 px-5 text-[11px]'>Explore events</Link>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <section className='space-y-4'>
                    <span className='ea-label ea-label--muted'>Upcoming</span>
                    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                      {upcoming.map((event) => <SavedEventCard key={event.id} event={event} />)}
                    </div>
                  </section>
                )}
                {past.length > 0 && (
                  <section className='space-y-4'>
                    <span className='ea-label ea-label--muted'>Past</span>
                    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                      {past.map((event) => <SavedEventCard key={event.id} event={event} />)}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* Saved spaces tab */}
        {tab === 'spaces' && (
          <div className='space-y-4'>
            {savedSpaces.length === 0 ? (
              <div className='rounded-[28px] border border-[var(--foreground)]/10 bg-[var(--background)]/70 px-8 py-12 text-center'>
                <p className='text-sm text-[var(--foreground)]/50 uppercase tracking-[0.2em]'>No saved spaces yet</p>
                <p className='mt-2 text-xs text-[var(--foreground)]/35'>Visit a space page and hit Save.</p>
                <Link href='/map' className='nav-action mt-6 !inline-flex h-9 px-5 text-[11px]'>Explore spaces</Link>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {savedSpaces.map((space) => <SavedSpaceCard key={space.id} space={space} />)}
              </div>
            )}
          </div>
        )}

        {/* Visited spaces tab */}
        {tab === 'visited' && (
          <div className='space-y-4'>
            {visitedSpaces.length === 0 ? (
              <div className='rounded-[28px] border border-[var(--foreground)]/10 bg-[var(--background)]/70 px-8 py-12 text-center'>
                <p className='text-sm text-[var(--foreground)]/50 uppercase tracking-[0.2em]'>No visited spaces yet</p>
                <p className='mt-2 text-xs text-[var(--foreground)]/35'>Visit a space page and hit &ldquo;I was here&rdquo;.</p>
                <Link href='/map' className='nav-action mt-6 !inline-flex h-9 px-5 text-[11px]'>Explore spaces</Link>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {visitedSpaces.map((space) => <SavedSpaceCard key={space.id} space={space} />)}
              </div>
            )}
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <section className='rounded-[32px] border border-[var(--foreground)]/14 bg-[var(--background)]/88 px-8 py-8 backdrop-blur-2xl sm:px-12 sm:py-12'>
            <form onSubmit={handleSaveProfile} className='space-y-6'>
              <fieldset className='space-y-6'>
                <legend className='ea-label ea-label--muted'>Edit profile</legend>

                <div className='space-y-2'>
                  <label htmlFor='email' className='ea-label ea-label--muted'>Email</label>
                  <p className='text-sm text-[var(--foreground)]/60'>{user?.email}</p>
                </div>

                <div className='space-y-2'>
                  <label htmlFor='display-name' className='ea-label ea-label--muted'>Display name</label>
                  <input id='display-name' type='text'
                    className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                    value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete='name' />
                </div>

                <div className='space-y-2'>
                  <label htmlFor='location' className='ea-label ea-label--muted'>Location</label>
                  <input id='location' type='text'
                    className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                    value={location} onChange={(e) => setLocation(e.target.value)} placeholder='City, country' />
                </div>

                <div className='space-y-2'>
                  <label htmlFor='bio' className='ea-label ea-label--muted'>Bio</label>
                  <textarea id='bio'
                    className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
                    value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                </div>
              </fieldset>

              <div className='flex flex-wrap gap-3'>
                <button type='submit'
                  className='nav-action nav-cta !inline-flex h-11 px-6 text-[12px] uppercase tracking-[0.32em] disabled:opacity-60'
                  disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button type='button' onClick={handleChangePassword}
                  className='nav-action !inline-flex h-10 px-6 text-[11px] uppercase tracking-[0.28em]'>
                  Change password
                </button>
                <button type='button' onClick={handleSignOut}
                  className='nav-action !inline-flex h-10 px-6 text-[11px] uppercase tracking-[0.28em]'>
                  Sign out
                </button>
              </div>
            </form>
          </section>
        )}

      </div>
    </main>
  );
}

function SavedEventCard({ event }) {
  const href = `/events/${event.id}`;
  const when = formatDateRange(event.start_date, event.end_date, event.start_time, event.end_time);
  const spaceName = event.spaces?.name;
  const city = event.spaces?.city_name || event.spaces?.city;

  return (
    <Link href={href}
      className='group flex flex-col gap-3 overflow-hidden rounded-[24px] border border-[var(--foreground)]/12 bg-[var(--background)]/70 p-4 transition hover:border-[var(--foreground)]/30'>
      <div className='aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[var(--foreground)]/5'>
        <EventFlyer
          event={event}
          spaceCategory={event.spaces?.category || event.spaces?.type}
          alt={event.title}
          imgClassName='h-full w-full object-cover transition group-hover:scale-[1.02]'
          fallbackClassName='h-full !aspect-auto'
        />
      </div>
      <div className='space-y-1'>
        <p className='text-sm font-medium leading-snug text-[var(--foreground)]'>{event.title}</p>
        {when && <p className='font-mono text-xs text-[var(--foreground)]/55 uppercase tracking-[0.18em]'>{when}</p>}
        {(spaceName || city) && (
          <p className='text-xs text-[var(--foreground)]/40 uppercase tracking-[0.18em]'>
            {[spaceName, city].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}

function SavedSpaceCard({ space }) {
  return (
    <Link href={`/spaces/${space.id}`}
      className='group flex items-center gap-4 overflow-hidden rounded-[24px] border border-[var(--foreground)]/12 bg-[var(--background)]/70 p-4 transition hover:border-[var(--foreground)]/30'>
      {space.image_url ? (
        <div className='h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-[var(--foreground)]/5'>
          <img src={space.image_url} alt={space.name} className='h-full w-full object-cover' onError={(e) => { e.target.style.display = 'none'; }} />
        </div>
      ) : (
        <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)]/5 text-[10px] uppercase tracking-[0.2em] text-[var(--foreground)]/30'>
          —
        </div>
      )}
      <div className='min-w-0 space-y-0.5'>
        <p className='truncate text-sm font-medium text-[var(--foreground)]'>{space.name}</p>
        {(space.city_name || space.city) && <p className='text-xs uppercase tracking-[0.18em] text-[var(--foreground)]/45'>{space.city_name || space.city}</p>}
        {space.type && <p className='text-xs uppercase tracking-[0.18em] text-[var(--foreground)]/30'>{space.type}</p>}
      </div>
    </Link>
  );
}
