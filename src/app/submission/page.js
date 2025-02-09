// src/app/submission/page.js
'use client'; // This page uses client-side interactivity

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SubmissionForm() {
  // State to store form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    date: '',
    category: '',
    designer: '',
    space: '',
    latitude: '',
    longitude: '',
  });

  // States for success or error messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare the data to insert.
    // Note: We convert latitude and longitude to numbers.
    const dataToInsert = {
      title: formData.title,
      description: formData.description,
      city: formData.city,
      date: formData.date, // The input type "date" produces a string (YYYY-MM-DD)
      category: formData.category,
      designer: formData.designer,
      space: formData.space,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      approved: false, // New submissions are not approved by default
    };

    // Insert the event into the "events" table in Supabase
    const { data, error } = await supabase
      .from('events')
      .insert([dataToInsert]);

    if (error) {
      console.error('Error inserting event:', error);
      setError('There was an error submitting your event.');
      setMessage('');
    } else {
      setMessage(
        'Event submitted successfully! It will be displayed after approval.'
      );
      setError('');
      // Clear the form
      setFormData({
        title: '',
        description: '',
        city: '',
        date: '',
        category: '',
        designer: '',
        space: '',
        latitude: '',
        longitude: '',
      });
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Submit an Event</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
        <div>
          <label>Title:</label>
          <br />
          <input
            type='text'
            name='title'
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <br />
          <textarea
            name='description'
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>City:</label>
          <br />
          <input
            type='text'
            name='city'
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Date:</label>
          <br />
          <input
            type='date'
            name='date'
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Category:</label>
          <br />
          <input
            type='text'
            name='category'
            value={formData.category}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Designer:</label>
          <br />
          <input
            type='text'
            name='designer'
            value={formData.designer}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Space:</label>
          <br />
          <input
            type='text'
            name='space'
            value={formData.space}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Latitude:</label>
          <br />
          <input
            type='text'
            name='latitude'
            value={formData.latitude}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Longitude:</label>
          <br />
          <input
            type='text'
            name='longitude'
            value={formData.longitude}
            onChange={handleChange}
            required
          />
        </div>
        <button type='submit'>Submit Event</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
