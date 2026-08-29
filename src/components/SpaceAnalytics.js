'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { formatDate } from '@/lib/date';

export default function SpaceAnalytics({ spaceId }) {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saves, setSaves] = useState(0);
  const [visits, setVisits] = useState(0);
  const [events, setEvents] = useState([]);
  const [eventSaves, setEventSaves] = useState({});

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [savesRes, visitsRes, eventsRes] = await Promise.all([
        supabase
          .from('saved_spaces')
          .select('id', { count: 'exact', head: true })
          .eq('space_id', spaceId),
        supabase
          .from('space_visits')
          .select('id', { count: 'exact', head: true })
          .eq('space_id', spaceId),
        supabase
          .from('events')
          .select('id, title, start_date')
          .eq('space_id', spaceId)
          .order('start_date', { ascending: false }),
      ]);

      if (cancelled) return;

      setSaves(savesRes.count ?? 0);
      setVisits(visitsRes.count ?? 0);
      const eventRows = eventsRes.data ?? [];
      setEvents(eventRows);

      if (eventRows.length > 0) {
        const { data: saveRows } = await supabase
          .from('saved_events')
          .select('event_id')
          .in(
            'event_id',
            eventRows.map((e) => e.id)
          );
        if (!cancelled) {
          const counts = {};
          for (const row of saveRows ?? []) {
            counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
          }
          setEventSaves(counts);
        }
      } else {
        setEventSaves({});
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [spaceId, supabase]);

  if (loading) {
    return <p className='text-sm text-[var(--foreground)]/60'>Loading analytics…</p>;
  }

  const sortedEvents = [...events].sort(
    (a, b) => (eventSaves[b.id] ?? 0) - (eventSaves[a.id] ?? 0)
  );

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatTile label='Space saves' value={saves} />
        <StatTile label='Profile visits' value={visits} />
        <StatTile label='Events posted' value={events.length} />
      </div>

      <div className='space-y-3'>
        <span className='ea-label ea-label--muted'>Saves per event</span>
        {sortedEvents.length === 0 ? (
          <p className='text-sm text-[var(--foreground)]/60'>
            No events posted yet — saves per event will show up here once you do.
          </p>
        ) : (
          <ul className='space-y-2'>
            {sortedEvents.map((event) => (
              <li
                key={event.id}
                className='flex items-center justify-between gap-4 rounded-2xl border border-[var(--foreground)]/14 bg-[var(--background)]/70 px-4 py-3'>
                <div className='min-w-0'>
                  <div className='truncate text-sm font-medium text-[var(--foreground)]'>
                    {event.title}
                  </div>
                  {event.start_date && (
                    <div className='mt-0.5 text-[11px] uppercase tracking-[0.16em] text-[var(--foreground)]/50'>
                      {formatDate(event.start_date)}
                    </div>
                  )}
                </div>
                <div className='flex-shrink-0 text-right'>
                  <div className='text-lg font-semibold text-[var(--foreground)]'>
                    {eventSaves[event.id] ?? 0}
                  </div>
                  <div className='text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/50'>
                    saves
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className='rounded-2xl border border-[var(--foreground)]/14 bg-[var(--background)]/70 px-5 py-4'>
      <div className='text-3xl font-semibold text-[var(--foreground)]'>{value}</div>
      <div className='mt-1 ea-label ea-label--muted'>{label}</div>
    </div>
  );
}
