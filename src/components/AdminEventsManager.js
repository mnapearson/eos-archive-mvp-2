'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import EditEventForm from '@/components/EditEventForm';
import EventCard from '@/components/EventCard';

export default function AdminEventsManager({
  initialEvents,
  spaceId,
  filter = '',
  editable,
  emptyMessage = 'No events found yet for this space.',
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [events, setEvents] = useState(initialEvents || []);
  const [editingEventId, setEditingEventId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const gridClass =
    filter === 'pending'
      ? 'grid grid-cols-1 gap-6'
      : 'grid grid-cols-1 gap-6 xl:grid-cols-2';

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;

    async function fetchEvents() {
      try {
        let query = supabase
          .from('events')
          .select('*')
          .eq('space_id', spaceId)
          .order('start_date', { ascending: false })
          .order('start_time', { ascending: false });

        if (filter === 'pending') {
          query = query.eq('approved', false);
        } else if (filter === 'approved') {
          query = query.eq('approved', true);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching events:', error.message || error);
          toast.error('Unable to load events right now.');
          return;
        }

        if (!cancelled && Array.isArray(data)) {
          setEvents(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Unexpected error fetching events:', err);
          toast.error('Unable to load events right now.');
        }
      }
    }

    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [spaceId, filter, supabase]);

  const handleSaved = (updatedData) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedData.id ? { ...e, ...updatedData } : e))
    );
    setEditingEventId(null);
    router.refresh();
  };

  const confirmDelete = async (eventId) => {
    if (!spaceId) return;
    setDeletingId(eventId);

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('space_id', spaceId);

      if (error) {
        console.error('Error deleting event:', error);
        toast.error('Unable to delete this event right now.');
        return;
      }

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Event deleted.');
      router.refresh();

      if (editingEventId === eventId) setEditingEventId(null);
    } catch (err) {
      console.error('Unexpected error deleting event:', err);
      toast.error('Unable to delete this event right now.');
    } finally {
      setDeletingId(null);
      setConfirmingDeleteId(null);
    }
  };

  if (!events.length) {
    return (
      <div className='rounded-3xl border border-[var(--foreground)]/14 bg-[var(--background)]/85 px-6 py-10 text-sm leading-relaxed text-[var(--foreground)]/70 shadow-[0_24px_70px_rgba(0,0,0,0.18)]'>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {events.map((event) => (
        <article
          key={event.id}
          className='relative overflow-hidden sm:p-8'>
          <div className='pointer-events-none absolute inset-0 -z-10 opacity-60 blur-3xl' />

          {editingEventId === event.id ? (
            <EditEventForm
              event={event}
              spaceId={spaceId}
              onSaved={handleSaved}
              onCancel={() => setEditingEventId(null)}
            />
          ) : (
            <EventCard
              event={event}
              editable={editable}
              confirmingDelete={confirmingDeleteId === event.id}
              deleting={deletingId === event.id}
              onEdit={() => setEditingEventId(event.id)}
              onRequestDelete={() => setConfirmingDeleteId(event.id)}
              onCancelDelete={() => setConfirmingDeleteId(null)}
              onConfirmDelete={() => confirmDelete(event.id)}
            />
          )}
        </article>
      ))}
    </div>
  );
}
