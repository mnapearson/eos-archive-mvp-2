'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import MapComponent from '@/components/MapComponent';
import SpaceListItem from '@/components/SpaceListItem';
import Spinner from '@/components/Spinner';
import MasonryGrid from '@/components/MasonryGrid';
import { supabase } from '@/lib/supabaseClient';

export default function SpacePage() {
  const { id } = useParams();
  const [space, setSpace] = useState(null);
  const [events, setEvents] = useState([]);
  const [timeFilter, setTimeFilter] = useState(null);

  const displayEvents = useMemo(() => {
    const today = new Date();
    let evs = events;

    // Time-based grouping
    if (timeFilter) {
      evs = evs.filter((e) => {
        const start = new Date(e.start_date);
        const end = e.end_date ? new Date(e.end_date) : start;

        if (timeFilter === 'upcoming') {
          return start > today;
        }
        if (timeFilter === 'current') {
          return start <= today && end >= today;
        }
        return end < today;
      });
    }

    return evs
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [events, timeFilter]);

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

  const enrichedEvents = useMemo(
    () => {
      if (!space) return displayEvents;
      return displayEvents.map((event) => ({
        ...event,
        space_name: space.name || space.space_name,
        space_city: space.city || space.space_city,
        space_country: space.country || space.space_country,
      }));
    },
    [displayEvents, space]
  );

  if (!space) {
    return <Spinner />;
  }

  const timeOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'current', label: 'Current' },
    { value: 'past', label: 'Past' },
  ];

  return (
    <div className='space-y-10 pb-10'>
      <SpaceListItem
        space={space}
        variant='detail'
      />

      <div className='rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/70 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.14)]'>
        <div className='h-[320px] overflow-hidden rounded-2xl border border-[var(--foreground)]/12'>
          <MapComponent
            spaces={[space]}
            autoFit
            focusSpaceId={space.id}
            showPopups={false}
          />
        </div>
      </div>

      <section className='space-y-6'>
        <header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <span className='ea-label ea-label--muted'>Events at</span>
            <h2 className='text-2xl font-semibold tracking-tight text-[var(--foreground)]'>
              {space.name}
            </h2>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {timeOptions.map(({ value, label }) => {
              const active = timeFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setTimeFilter(active ? null : value)}
                  className={`nav-action h-9 px-4 text-[11px] uppercase tracking-[0.28em] ${
                    active
                      ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
                      : ''
                  }`}>
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {enrichedEvents.length > 0 ? (
          <MasonryGrid
            items={enrichedEvents}
            mode='list'
          />
        ) : (
          <p className='text-sm italic text-[var(--foreground)]/70'>
            No events found.
          </p>
        )}
      </section>

      <div className='flex justify-center pt-2'>
        <a
          href='/map'
          className='nav-action inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em]'>
          Explore more spaces <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
