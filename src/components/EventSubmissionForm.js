'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function EventSubmissionForm({ spaceId }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    category: '',
    designer: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size exceeds 5MB. Please choose a smaller file.');
        return;
      }
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!agreed) {
      setError('You must agree to the Terms and Conditions to submit.');
      return;
    }

    const dataToInsert = {
      ...formData,
      space_id: spaceId,
      approved: false,
      image_url: null,
    };

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: storageError } = await supabase.storage
        .from('event-images')
        .upload(filePath, imageFile);
      if (storageError) {
        console.error('Error uploading image:', storageError);
        setError('Error uploading the image.');
        return;
      }
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

    const { error: insertError } = await supabase
      .from('events')
      .insert([dataToInsert]);
    if (insertError) {
      console.error('Error inserting event:', insertError);
      setError('Error submitting your event. Please try again.');
      return;
    }

    setMessage('Event submitted successfully!');
    // Optionally, reset the form and redirect after a delay
    setFormData({
      title: '',
      date: '',
      time: '',
      category: '',
      designer: '',
      description: '',
    });
    setImageFile(null);
    router.push('/submission-success');
  };

  return (
    <div className='glow-box'>
      <h2 className='font-bold mb-4'>submit an event</h2>
      <form
        onSubmit={handleSubmit}
        className='space-y-4'>
        <div>
          <label className='block text-sm mb-1'>Title</label>
          <input
            type='text'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            required
            className='w-full p-2 border-b border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Date</label>
          <input
            type='date'
            name='date'
            value={formData.date}
            onChange={handleInputChange}
            required
            className='w-full p-2 border-b border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Time</label>
          <input
            type='time'
            name='time'
            value={formData.time}
            onChange={handleInputChange}
            className='w-full p-2 border-b border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Category</label>
          <input
            type='text'
            name='category'
            value={formData.category}
            onChange={handleInputChange}
            required
            className='w-full p-2 border-b border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Designer</label>
          <input
            type='text'
            name='designer'
            value={formData.designer}
            onChange={handleInputChange}
            required
            className='w-full p-2 border-b border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Description</label>
          <textarea
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            rows='3'
            className='w-full p-2 border-b border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Event Art</label>
          <input
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            required
            className='w-full p-2 border-b border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)'
          />
        </div>
        <div className='flex items-center'>
          <input
            type='checkbox'
            id='terms'
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
            className='mr-2'
          />
          <label
            htmlFor='terms'
            className='text-sm'>
            I agree to the{' '}
            <a
              href='/terms'
              className='underline'>
              Terms and Conditions
            </a>
          </label>
        </div>
        {error && <p className='text-red-500 text-sm'>{error}</p>}
        {message && <p className='text-green-500 text-sm'>{message}</p>}
        <button
          type='submit'
          className='glow-button'>
          Submit Event
        </button>
      </form>
    </div>
  );
}
