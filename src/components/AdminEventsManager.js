// src/components/AdminEventsManager.js
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function AdminEventsManager({ initialEvents, spaceId }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents || []);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newImageFile, setNewImageFile] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (spaceId) {
      async function fetchEvents() {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('space_id', spaceId);
        if (error) {
          console.error('Error fetching events:', error);
          setError('Error fetching events.');
        } else {
          setEvents(data);
        }
      }
      fetchEvents();
    }
  }, [spaceId]);

  // When the user clicks edit, load the event data into our state
  const handleEditClick = (ev) => {
    setEditingEventId(ev.id);
    setEditFormData({
      title: ev.title,
      date: ev.date,
      time: ev.time,
      category: ev.category,
      designer: ev.designer,
      description: ev.description,
    });
    setNewImageFile(null);
    setAgreed(false);
    setError('');
    setMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size exceeds 5MB. Please choose a smaller file.');
        return;
      }
      setNewImageFile(file);
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditFormData({});
    setNewImageFile(null);
    setAgreed(false);
    setError('');
    setMessage('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // If a new image was selected, require T&C re-acceptance
    if (newImageFile && !agreed) {
      setError(
        'You must agree to the Terms and Conditions when updating the image.'
      );
      return;
    }

    // Start with the updated text fields
    const updatedData = { ...editFormData };

    // If the admin chose a new image, upload and update image_url
    if (newImageFile) {
      const fileExt = newImageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload the file to the 'event-images' bucket; use upsert to replace any existing file with the same name
      const { error: storageError } = await supabase.storage
        .from('event-images')
        .upload(filePath, newImageFile, { upsert: true });
      if (storageError) {
        console.error('Error uploading new image:', storageError);
        setError('Error uploading new image.');
        return;
      }

      const { data: publicData, error: urlError } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);
      if (urlError) {
        console.error('Error getting public URL for new image:', urlError);
        setError('Error retrieving new image URL.');
        return;
      }
      updatedData.image_url = publicData.publicUrl;
    }

    // Mark that the event must be reapproved and terms confirmed
    updatedData.terms_accepted = true;
    updatedData.approved = false;

    // Update the event in the events table
    const { error: updateError } = await supabase
      .from('events')
      .update(updatedData)
      .eq('id', editingEventId)
      .eq('space_id', spaceId);
    if (updateError) {
      console.error('Error updating event:', updateError);
      setError('Error updating event. Please try again.');
      return;
    }

    // Update the local events list
    const updatedEvents = events.map((ev) =>
      ev.id === editingEventId ? { ...ev, ...updatedData } : ev
    );
    setEvents(updatedEvents);
    setMessage('Event updated successfully and is pending approval.');
    // Exit edit mode
    setEditingEventId(null);
    setEditFormData({});
    setNewImageFile(null);
    setAgreed(false);
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('space_id', spaceId);
    if (deleteError) {
      console.error('Error deleting event:', deleteError);
      setError('Error deleting event.');
      return;
    }
    const updatedEvents = events.filter((ev) => ev.id !== eventId);
    setEvents(updatedEvents);
  };

  return (
    <div className='space-y-6'>
      {events.map((ev) => (
        <div
          key={ev.id}
          className='relative glow-box'>
          {/* Status badge for the event */}
          {!ev.approved ? (
            <span className='absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded'>
              Pending Approval
            </span>
          ) : (
            <span className='absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded'>
              Approved
            </span>
          )}
          {editingEventId === ev.id ? (
            <form
              onSubmit={handleSaveEdit}
              className='space-y-4 relative z-20'>
              <div>
                <label className='block text-sm font-medium'>Title</label>
                <input
                  type='text'
                  name='title'
                  value={editFormData.title}
                  onChange={handleInputChange}
                  required
                  className='input mt-1'
                />
              </div>
              <div className='flex gap-4'>
                <div className='w-1/2'>
                  <label className='block text-sm font-medium'>Date</label>
                  <input
                    type='date'
                    name='date'
                    value={editFormData.date}
                    onChange={handleInputChange}
                    required
                    className='input mt-1'
                  />
                </div>
                <div className='w-1/2'>
                  <label className='block text-sm font-medium'>Time</label>
                  <input
                    type='time'
                    name='time'
                    value={editFormData.time}
                    onChange={handleInputChange}
                    required
                    className='input mt-1'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium'>Category</label>
                <input
                  type='text'
                  name='category'
                  value={editFormData.category}
                  onChange={handleInputChange}
                  required
                  className='input mt-1'
                />
              </div>
              <div>
                <label className='block text-sm font-medium'>Designer</label>
                <input
                  type='text'
                  name='designer'
                  value={editFormData.designer}
                  onChange={handleInputChange}
                  required
                  className='input mt-1'
                />
              </div>
              <div>
                <label className='block text-sm font-medium'>Description</label>
                <textarea
                  name='description'
                  value={editFormData.description}
                  onChange={handleInputChange}
                  rows='3'
                  className='input mt-1'
                />
              </div>
              <div>
                <label className='block text-sm font-medium'>
                  Update Event Image
                </label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleFileChange}
                  className='input mt-1'
                />
              </div>
              {newImageFile && (
                <div>
                  <p className='text-sm'>
                    New image selected: {newImageFile.name}
                  </p>
                </div>
              )}
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className='mr-2'
                />
                <label className='text-sm'>
                  I agree to the{' '}
                  <a
                    href='/terms'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline'>
                    Terms and Conditions
                  </a>
                </label>
              </div>
              {error && <p className='text-red-500 text-sm'>{error}</p>}
              {message && <p className='text-green-500 text-sm'>{message}</p>}
              <div className='flex gap-4'>
                <button
                  type='submit'
                  className='glow-button'>
                  Save
                </button>
                <button
                  type='button'
                  onClick={handleCancelEdit}
                  className='glow-button bg-gray-400'>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className='flex flex-col md:flex-row gap-4 relative z-20'>
              <div className='w-full md:w-1/3'>
                {ev.image_url ? (
                  <img
                    src={ev.image_url}
                    alt={ev.title}
                    className='object-cover w-full h-full rounded'
                  />
                ) : (
                  <div className='w-full h-full bg-gray-200 flex items-center justify-center rounded'>
                    <span>No image</span>
                  </div>
                )}
              </div>
              <div className='w-full md:w-2/3'>
                <h3 className='text-xl font-bold'>{ev.title}</h3>
                <p className='text-sm text-gray-600'>
                  {ev.date} at {ev.time}
                </p>
                <p className='text-sm text-gray-600'>Category: {ev.category}</p>
                <p className='text-sm text-gray-600'>Designer: {ev.designer}</p>
                <p className='mt-2'>{ev.description}</p>
                <div className='flex gap-2 mt-4'>
                  <button
                    onClick={() => handleEditClick(ev)}
                    className='glow-button text-sm'>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className='glow-button text-sm bg-red-600'>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
