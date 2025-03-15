'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LocaleRouteNormalizer } from 'next/dist/server/normalizers/locale-route-normalizer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DynamicSubmissionForm() {
  const router = useRouter();

  // Only event-specific fields remain
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Dynamic options from events table for suggestions
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);

  useEffect(() => {
    async function fetchOptions() {
      // Fetch Categories from events
      const { data: catData } = await supabase
        .from('events')
        .select('category')
        .eq('approved', true);

      const uniqueCategories = [
        ...new Set(catData?.map((item) => item.category).filter(Boolean)),
      ];
      setCategoryOptions(uniqueCategories);

      // Fetch Designers from events
      const { data: designerData } = await supabase
        .from('events')
        .select('designer')
        .eq('approved', true);

      const uniqueDesigners = [
        ...new Set(designerData?.map((item) => item.designer).filter(Boolean)),
      ];
      setDesignerOptions(uniqueDesigners);
    }
    fetchOptions();
  }, []);

  // Handle input changes
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

  // Handle form submission:
  // 1. Retrieve the current user's space record (based on user_id from the session).
  // 2. Insert an event record that references the space's id.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!agreed) {
      setError('You must agree to the Terms and Conditions to submit.');
      return;
    }

    // Get current session and then the user's space record.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError('Please log in to submit an event.');
      return;
    }
    const userId = session.user.id;
    const { data: spaceData, error: spaceError } = await supabase
      .from('spaces')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (spaceError || !spaceData) {
      console.error('Error fetching space record:', spaceError);
      setError('Error retrieving your space info. Please try again.');
      return;
    }
    const spaceId = spaceData.id;

    // Prepare event data. The event will be linked to the user's space.
    const dataToInsert = {
      ...formData,
      space_id: spaceId,
      approved: false,
      image_url: null,
    };

    // Upload event art if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
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

    // Insert the event record
    const { error: insertError } = await supabase
      .from('events')
      .insert([dataToInsert]);
    if (insertError) {
      console.error('Error inserting event:', insertError);
      setError(
        'There was an error submitting your event. Please review required fields and try again.'
      );
      return;
    }

    // Reset form and redirect
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
    <div className='flex flex-col items-center justify-center min-h-screen bg-[var(--background)] text-[var(--foreground)]'>
      <div className='max-w-2xl w-full bg-[var(--background)] p-10 rounded-lg shadow-lg'>
        <h1 className='font-semibold mb-6 uppercase tracking-wide'>
          SUBMIT AN EVENT
        </h1>

        <form
          onSubmit={handleSubmit}
          className='grid gap-6'>
          {/* Title Field */}
          <div>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Title
            </label>
            <input
              type='text'
              name='title'
              value={formData.title}
              onChange={handleInputChange}
              placeholder='Enter a title'
              required
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
            />
          </div>

          {/* Category Field */}
          <div className='relative'>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Category
            </label>
            <input
              type='text'
              name='category'
              value={formData.category}
              onChange={handleInputChange}
              placeholder='Select or type a category'
              required
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
              autoComplete='off'
            />
            {/* Optionally, add a suggestion list */}
          </div>

          {/* Date Field */}
          <div>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Date
            </label>
            <input
              type='date'
              name='date'
              value={formData.date}
              onChange={handleInputChange}
              required
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
            />
          </div>

          {/* Time Field */}
          <div>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Time
            </label>
            <input
              type='time'
              name='time'
              value={formData.time}
              onChange={handleInputChange}
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
            />
          </div>

          {/* Event Art Upload */}
          <div>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Event Art
            </label>
            <input
              type='file'
              accept='image/*'
              onChange={handleFileChange}
              required
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
            />
          </div>

          {/* Designer Field */}
          <div className='relative'>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Designer
            </label>
            <input
              type='text'
              name='designer'
              value={formData.designer}
              onChange={handleInputChange}
              placeholder='Select or type a designer'
              required
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
              autoComplete='off'
            />
            {/* Optionally, add a suggestion list */}
          </div>

          {/* Description Field */}
          <div>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Description
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              placeholder='Enter additional details (optional)'
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
            />
          </div>

          {/* Terms and Conditions */}
          <div className='flex items-center mt-4'>
            <input
              type='checkbox'
              id='terms'
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className='mr-2'
              required
            />
            <label
              htmlFor='terms'
              className='text-xs'>
              I agree to the{' '}
              <Link
                href='/terms'
                className='underline hover:text-gray-400'>
                Terms and Conditions
              </Link>
              .
            </label>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            className='w-full py-3 bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:opacity-80 transition mt-6'>
            SUBMIT EVENT
          </button>
        </form>

        {message && (
          <p className='text-[var(--background)] mt-4 text-center'>{message}</p>
        )}
        {error && <p className='text-red-500 mt-4 text-center'>{error}</p>}
      </div>
    </div>
  );
}
