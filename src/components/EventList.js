'use client'; // This is a client-side component

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('approved', true);
      if (error) {
        console.error('Error fetching events:', error);
        setError('Error fetching events.');
      } else {
        setEvents(data);
      }
    }
    fetchEvents();
  }, []);

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              width: '300px',
              borderRadius: '4px',
              boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
            }}>
            {event.image_url && (
              <img
                src={event.image_url}
                alt={event.title}
                style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
              />
            )}
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p>
              {event.city} - {event.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
