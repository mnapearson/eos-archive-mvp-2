'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

// 4) Define your static categories
const EVENT_CATEGORIES = [
  'exhibition',
  'opening',
  'closing',
  'concert',
  'live music',
  'dj night',
  'day party',
  'festival',
  'performance',
  'workshop',
  'market',
  'film',
  'talk',
  'community',
  'other',
];

export default function EventSubmissionForm({ spaceId }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    space_id: spaceId || '',
    title: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    category: 'other', // default to 'other'
    designer: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [spacesList, setSpacesList] = useState([]);

  useEffect(() => {
    async function loadSpaces() {
      const { data, error } = await supabase.from('spaces').select('id, name');
      if (!error) setSpacesList(data);
    }
    loadSpaces();
  }, [supabase]);

  // Determine the logged-in space (for admin dashboard context)
  const currentSpace = spacesList.find((s) => s.id === spaceId);

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

  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Document exceeds 10MB. Please choose a smaller file.');
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    // get current user for created_by
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      toast.error('Authentication error. Please sign in again.');
      return;
    }
    // Ensure a profile row exists so created_by FK will not fail
    const { error: upsertProfileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id });
    if (upsertProfileError) {
      console.error('Profile upsert error:', upsertProfileError);
      toast.error('Error preparing your user profile. Please try again.');
      return;
    }

    if (!agreed) {
      toast.error('You must agree to the Terms and Conditions to submit.');
      return;
    }

    const dataToInsert = {
      ...formData,
      approved: true,
      image_url: null,
      document_url: null,
      terms_accepted: true,
      created_by: user.id,
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
        toast.error('Error uploading the image.');
        return;
      }
      const { data: publicData, error: urlError } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);
      if (urlError) {
        console.error('Error getting public URL:', urlError);
        toast.error('Error retrieving the image URL.');
        return;
      }
      dataToInsert.image_url = publicData.publicUrl;
    }

    // Upload document if provided
    if (documentFile) {
      const docExt = documentFile.name.split('.').pop();
      const docName = `${Date.now()}.${docExt}`;
      const docPath = docName;

      const { error: docError } = await supabase.storage
        .from('event-documents')
        .upload(docPath, documentFile);
      if (docError) {
        console.error('Error uploading document:', docError);
        toast.error('Error uploading the document.');
        return;
      }
      const { data: docPublic, error: docUrlError } = supabase.storage
        .from('event-documents')
        .getPublicUrl(docPath);
      if (docUrlError) {
        console.error('Error getting document URL:', docUrlError);
        toast.error('Error retrieving the document URL.');
        return;
      }
      dataToInsert.document_url = docPublic.publicUrl;
    }

    const { error: insertError } = await supabase
      .from('events')
      .insert([dataToInsert]);
    if (insertError) {
      console.error('Error inserting event:', insertError);
      toast.error('Error submitting your event. Please try again.');
      return;
    }

    toast.success('Event submitted successfully!');
    // Optionally, reset the form and redirect after a delay
    setFormData({
      space_id: spaceId || '',
      title: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      category: 'other',
      designer: '',
      description: '',
    });
    setImageFile(null);
    router.push('/submission-success');
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className='space-y-4 glow-box'>
        {spaceId ? (
          // Read-only for space-owner context
          <div>
            <label className='block text-sm mb-1'>Space</label>
            <input
              type='text'
              value={currentSpace?.name || ''}
              readOnly
              className='input bg-gray-100 cursor-not-allowed'
            />
          </div>
        ) : (
          // Dropdown for other contexts
          <div>
            <label className='block text-sm mb-1'>Space*</label>
            <select
              name='space_id'
              value={formData.space_id}
              onChange={handleInputChange}
              required
              className='input'>
              <option
                value=''
                disabled>
                Select a space
              </option>
              {spacesList.map((s) => (
                <option
                  key={s.id}
                  value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className='block text-sm mb-1'>Title*</label>
          <input
            type='text'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            required
            className='input'
          />
        </div>
        <div className='flex gap-4'>
          <div className='w-1/2'>
            <label className='block text-sm mb-1'>Start Date*</label>
            <input
              type='date'
              name='start_date'
              value={formData.start_date}
              onChange={handleInputChange}
              required
              className='input'
            />
          </div>
          <div className='w-1/2'>
            <label className='block text-sm mb-1'>End Date*</label>
            <input
              type='date'
              name='end_date'
              value={formData.end_date}
              onChange={handleInputChange}
              required
              className='input'
            />
          </div>
        </div>
        <div className='flex gap-4'>
          <div className='w-1/2'>
            <label className='block text-sm mb-1'>Start Time*</label>
            <input
              type='time'
              name='start_time'
              value={formData.start_time}
              onChange={handleInputChange}
              required
              className='input'
            />
          </div>
          <div className='w-1/2'>
            <label className='block text-sm mb-1'>End Time*</label>
            <input
              type='time'
              name='end_time'
              value={formData.end_time}
              onChange={handleInputChange}
              required
              className='input'
            />
          </div>
        </div>
        <div>
          <label className='block text-sm mb-1'>Category*</label>
          <select
            name='category'
            value={formData.category}
            onChange={handleInputChange}
            required
            className='input'>
            <option
              value=''
              disabled>
              Select a category
            </option>
            {EVENT_CATEGORIES.map((cat) => (
              <option
                key={cat}
                value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm mb-1'>Description</label>
          <textarea
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            rows='3'
            className='input'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Event Flyer*</label>
          <input
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            required
            className='input'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>
            Event Document (PDF, optional)
          </label>
          <input
            type='file'
            accept='application/pdf'
            onChange={handleDocumentChange}
            className='input'
          />
        </div>
        <div>
          <label className='block text-sm mb-1'>Flyer Designer*</label>
          <input
            type='text'
            name='designer'
            value={formData.designer}
            onChange={handleInputChange}
            required
            className='input'
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
              target='_blank'
              rel='noopener noreferrer'
              className='underline'>
              Terms and Conditions
            </a>
            *
          </label>
        </div>
        <button
          type='submit'
          className='glow-button'>
          Submit Event
        </button>
      </form>
    </div>
  );
}
