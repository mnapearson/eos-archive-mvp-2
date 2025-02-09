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

  // State to store the selected image file
  const [imageFile, setImageFile] = useState(null);

  // States for success or error messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5242880; // 5MB in bytes

      if (file.size > maxSize) {
        alert('File size exceeds 5MB. Please choose a smaller file.');
        return;
      }
      setImageFile(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Prepare the data to insert.
    const dataToInsert = {
      title: formData.title,
      description: formData.description,
      city: formData.city,
      date: formData.date,
      category: formData.category,
      designer: formData.designer,
      space: formData.space,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      approved: false,
      image_url: null, // Will update if image is uploaded
    };

    // If an image file is selected, upload it to Supabase Storage first.
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to the "event-images" bucket.
      const { data: storageData, error: storageError } = await supabase.storage
        .from('event-images')
        .upload(filePath, imageFile);

      if (storageError) {
        console.error('Error uploading image:', storageError);
        setError('Error uploading the image.');
        return;
      }

      // Retrieve the public URL for the uploaded image.
      const { data: publicData, error: urlError } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      if (urlError) {
        console.error('Error getting public URL:', urlError);
        setError('Error retrieving the image URL.');
        return;
      }

      dataToInsert.image_url = publicData.publicUrl;
    }

    // Optional: Log the data to check the image_url value.
    console.log('Data to insert:', dataToInsert);

    // Insert the event into the "events" table in Supabase.
    const { data, error: insertError } = await supabase
      .from('events')
      .insert([dataToInsert]);

    if (insertError) {
      console.error('Error inserting event:', insertError);
      setError('There was an error submitting your event.');
      return;
    }

    setMessage(
      'Event submitted successfully! It will be displayed after approval.'
    );
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
    setImageFile(null);
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
        <div>
          <label>Event Art (Image):</label>
          <br />
          <input
            type='file'
            accept='image/*'
            onChange={handleFileChange}
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
