// src/components/EventApprovals.js
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function EventApprovals() {
  const [events, setEvents] = useState([]);

  // Fetch events that are pending approval when the component mounts
  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('approved', false);
      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data);
      }
    }
    fetchEvents();
  }, []);

  // Handle event approval
  async function handleApproveEvent(eventId) {
    const { data, error } = await supabase
      .from('events')
      .update({ approved: true })
      .eq('id', eventId);
    if (error) {
      console.error('Error approving event:', error);
    } else {
      // Remove the approved event from the list
      setEvents(events.filter((event) => event.id !== eventId));
    }
  }

  return (
    <div>
      {events.length === 0 ? (
        <p>No events pending approval.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li
              key={event.id}
              style={{ marginBottom: '1rem' }}>
              <div>
                <strong>{event.title}</strong>
                {event.description && <p>{event.description}</p>}
              </div>
              <button onClick={() => handleApproveEvent(event.id)}>
                Approve
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
