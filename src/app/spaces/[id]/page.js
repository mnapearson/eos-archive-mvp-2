'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
import SpaceListItem from '@/components/SpaceListItem';
import Spinner from '@/components/Spinner';
import { formatDateRange } from '@/lib/date';
import { supabase } from '@/lib/supabaseClient';

export default function SpacePage() {
  const { id } = useParams();
  const [space, setSpace] = useState(null);
  const [events, setEvents] = useState([]);
  const [timeFilter, setTimeFilter] = useState(null);

  // Local filter and sort state
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Derive unique categories from fetched events
  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category).filter(Boolean))),
    [events]
  );

  const displayEvents = useMemo(() => {
    const today = new Date();
    let evs = events;

    // Category filter, if any
    if (categoryFilter) {
      evs = evs.filter((e) => e.category === categoryFilter);
    }

    // Time-based filter (only if selected)
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
        if (timeFilter === 'past') {
          return end < today;
        }
        return true;
      });
    }

    // Sort ascending by start_date
    return evs
      .slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }, [events, categoryFilter, timeFilter]);

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

  if (!space) {
    return <Spinner />;
  }

  return (
    <div>
      <Link
        href='/map'
        className='text-sm hover:text-gray-600'
        scroll={false}>
        ← return to spaces map
      </Link>
      <div className='mt-4'>
        {/* Use the reusable SpaceListItem in detailed mode */}
        <SpaceListItem
          space={space}
          detailed={true}
        />
        <div className='mt-4'>
          <MapComponent spaces={[space]} />
        </div>
        <div className='mb-8'>
          <h2 className='font-semibold mb-6'>{space.name} events</h2>

          {/* Filter and sort controls */}
          <div className='mt-4 mb-4 flex flex-wrap items-center gap-4 justify-between overflow-visible'>
            <div className='flex gap-2'>
              {['upcoming', 'current', 'past'].map((tf) => {
                const active = timeFilter === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setTimeFilter(active ? null : tf)}
                    className={`button ${
                      active
                        ? 'bg-[var(--accent)] text-[var(--background)] border-transparent'
                        : ''
                    }`}>
                    {tf === 'past'
                      ? 'Past'
                      : tf.charAt(0).toUpperCase() + tf.slice(1)}
                    {active ? ' ×' : ''}
                  </button>
                );
              })}
            </div>
            {/* Category filter dropdown */}
            <div className='relative overflow-visible'>
              <button
                onClick={() => setShowCategoryMenu((open) => !open)}
                className='button'>
                {categoryFilter || 'Filter'} ▼
              </button>
              {showCategoryMenu && (
                <div
                  className='
  absolute mt-2 bg-[var(--background)] border border-[var(--foreground)] rounded shadow-lg z-10
  left-0 right-0 sm:left-auto sm:right-0
  w-full sm:w-[200px]
  max-h-60 overflow-y-auto
'>
                  <ul className='flex flex-col'>
                    {categories.map((cat) => (
                      <li key={cat}>
                        <button
                          className={`w-full text-xs text-left px-3 py-1 hover:bg-[var(--foreground)] hover:text-[var(--background)] uppercase ${
                            categoryFilter === cat ? 'font-semibold' : ''
                          }`}
                          onClick={() => {
                            setCategoryFilter(
                              categoryFilter === cat ? null : cat
                            );
                            setShowCategoryMenu(false);
                          }}>
                          {cat}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        className='w-full text-left text-xs px-3 py-1 hover:bg-[var(--foreground)] hover:text-[var(--background)]'
                        onClick={() => {
                          setCategoryFilter(null);
                          setShowCategoryMenu(false);
                        }}>
                        ALL
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {displayEvents.length > 0 ? (
            <ul className='space-y-4'>
              {displayEvents.map((event) => (
                <li
                  key={event.id}
                  className='flex flex-col md:flex-row items-start gap-2 pb-4 border-b border-[var(--foreground)]'>
                  <div className='w-1/3'>
                    <img
                      src={event.image_url || '/placeholder.jpg'}
                      alt={event.title}
                      className='w-full max-w-xs h-auto rounded shadow'
                    />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <Link
                        href={`/events/${event.id}`}
                        className='hover:underline text-lg font-semibold'>
                        {event.title}
                      </Link>
                      <p className='text-sm italic'>({event.category})</p>
                    </div>

                    <p className='text-sm mb-1'>
                      {formatDateRange(
                        event.start_date,
                        event.end_date,
                        event.start_time,
                        event.end_time
                      )}
                    </p>
                    <p className='text-sm whitespace-pre-line'>
                      {event.description}
                    </p>
                    {event.document_url && (
                      <p className='text-sm mt-1'>
                        <a
                          href={event.document_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='underline hover:text-gray-600'>
                          Download PDF
                        </a>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-sm italic'>No events found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
