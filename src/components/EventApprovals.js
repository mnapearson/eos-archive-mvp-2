// src/components/EventApprovals.js
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function EventApprovals() {
  const [events, setEvents] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');

  // Fetch events based on the selected status when the component mounts or when the selectedStatus changes
  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', selectedStatus);
      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data);
      }
    }
    fetchEvents();
  }, [selectedStatus]);

  // Approve an event: update its status to 'approved'
  async function handleApproveEvent(eventId) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', eventId);
    if (error) {
      console.error('Error approving event:', error);
    } else {
      // Remove the approved event from the list
      setEvents(events.filter((event) => event.id !== eventId));
    }
  }

  // Deny an event: update its status to 'denied'
  async function handleDenyEvent(eventId) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'denied' })
      .eq('id', eventId);
    if (error) {
      console.error('Error denying event:', error);
    } else {
      // Remove the denied event from the list
      setEvents(events.filter((event) => event.id !== eventId));
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setSelectedStatus('pending')}
          disabled={selectedStatus === 'pending'}>
          Pending
        </button>
        <button
          onClick={() => setSelectedStatus('approved')}
          disabled={selectedStatus === 'approved'}>
          Approved
        </button>
        <button
          onClick={() => setSelectedStatus('denied')}
          disabled={selectedStatus === 'denied'}>
          Denied
        </button>
      </div>

      {events.length === 0 ? (
        <p>No events in "{selectedStatus}" status.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li
              key={event.id}
              style={{
                marginBottom: '1rem',
                borderBottom: '1px solid #ccc',
                paddingBottom: '1rem',
              }}>
              <div>
                <strong>{event.title}</strong>
                {event.image && (
                  <div>
                    <img
                      src={event.image}
                      alt={event.title}
                      style={{ width: '100px', height: 'auto' }}
                    />
                  </div>
                )}
                <p>Space: {event.space}</p>
                <p>City: {event.city}</p>
                {event.description && <p>{event.description}</p>}
              </div>
              {selectedStatus === 'pending' && (
                <div>
                  <button onClick={() => handleApproveEvent(event.id)}>
                    Approve
                  </button>
                  <button onClick={() => handleDenyEvent(event.id)}>
                    Deny
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
