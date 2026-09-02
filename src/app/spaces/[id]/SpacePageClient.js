'use client';

import { useEffect, useState, useMemo } from 'react';
import MapComponent from '@/components/MapComponent';
import SpaceListItem from '@/components/SpaceListItem';
import Spinner from '@/components/Spinner';
import EventFeedCard from '@/components/EventFeedCard';
import SpaceVisitsAndNotes from '@/components/SpaceVisitsAndNotes';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';

export default function SpacePageClient({ spaceId }) {
  const supabase = getSupabaseBrowserClient();
  const id = spaceId;
  const [space, setSpace] = useState(null);
  const [events, setEvents] = useState([]);
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    async function fetchSpaceDetails() {
      if (!id) return;
      // Fetch the space details by id.
      const resSpace = await fetch(`/api/spaces/${id}`);
      const dataSpace = await resSpace.json();
      setSpace(dataSpace);

      // Fetch approved events associated with this space.
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('space_id', id);
      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(eventsData || []);
      }
    }
    if (id) {
      fetchSpaceDetails();
    }
  }, [id]);

  // Same split as mobile (app/space/[id].tsx): upcoming vs past by
  // start_date only, no separate "current" bucket.
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = [];
    const past = [];
    events.forEach((e) => {
      (e.start_date >= today ? upcoming : past).push(e);
    });
    upcoming.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    past.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  const enrich = (evs) => {
    if (!space) return evs;
    return evs.map((event) => ({
      ...event,
      space_name: space.name || space.space_name,
      space_city: space.city || space.space_city,
      space_country: space.country || space.space_country,
      space_type: space.category || space.type,
    }));
  };

  const enrichedUpcoming = useMemo(() => enrich(upcomingEvents), [upcomingEvents, space]);
  const enrichedPast = useMemo(() => enrich(pastEvents), [pastEvents, space]);

  if (!space) {
    return <Spinner />;
  }

  const instagramUrl = space.instagram
    ? `https://instagram.com/${String(space.instagram).replace(/^@/, '')}`
    : null;

  return (
    <div className='space-y-10 pb-10'>
      <SpaceListItem
        space={space}
        variant='detail'
      />

      <div className='rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/70 p-4'>
        <div className='h-[320px] overflow-hidden rounded-2xl border border-[var(--foreground)]/12'>
          <MapComponent
            spaces={[space]}
            autoFit
            focusSpaceId={space.id}
            showPopups={false}
          />
        </div>
      </div>

      <SpaceVisitsAndNotes spaceId={space.id} />

      {(instagramUrl || space.website) && (
        <section className='space-y-4'>
          <span className='ea-label ea-label--muted'>Links</span>
          <div className='flex flex-wrap gap-3'>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='detail-link-btn'>
                Instagram
              </a>
            )}
            {space.website && (
              <a
                href={space.website}
                target='_blank'
                rel='noopener noreferrer'
                className='detail-link-btn'>
                Website
              </a>
            )}
          </div>
        </section>
      )}

      {enrichedUpcoming.length > 0 && (
        <section className='space-y-4'>
          <span className='ea-label ea-label--muted'>Upcoming events</span>
          <div className='space-y-4'>
            {enrichedUpcoming.map((event) => (
              <EventFeedCard
                key={event.id}
                event={event}
                className='event-feed-card--list'
              />
            ))}
          </div>
        </section>
      )}

      {enrichedPast.length > 0 && (
        <section className='space-y-3'>
          <span className='ea-label ea-label--muted'>Past events</span>
          <p className='text-xs text-[var(--foreground)]/55'>
            A record of everything that&rsquo;s happened at this space.
          </p>
          <button
            type='button'
            onClick={() => setShowPastEvents((v) => !v)}
            className='detail-text-link inline-flex items-center gap-1.5'>
            {showPastEvents ? 'Hide' : 'Show'} {enrichedPast.length} past event
            {enrichedPast.length === 1 ? '' : 's'}
            <span aria-hidden>{showPastEvents ? '↑' : '↓'}</span>
          </button>
          {showPastEvents && (
            <div className='space-y-4 pt-1'>
              {enrichedPast.map((event) => (
                <EventFeedCard
                  key={event.id}
                  event={event}
                  className='event-feed-card--list'
                />
              ))}
            </div>
          )}
        </section>
      )}

      <div className='flex justify-center pt-2'>
        <a
          href='/map'
          className='nav-action inline-flex items-center gap-2'>
          Explore more spaces <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
