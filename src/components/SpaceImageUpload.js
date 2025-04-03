'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SpaceImageUpload({ spaceId }) {
  const supabase = createClientComponentClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and GIF images are allowed.');
        return;
      }
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('Image size must be less than 2MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      // Get the current user ID from Supabase auth.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated.');
        return;
      }
      const userId = user.id;
      const fileName = selectedFile.name;
      const filePath = `${userId}/${fileName}`;

      // Upload the file to the "space-images" bucket.
      const { error: uploadError } = await supabase.storage
        .from('space-images')
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: true,
        });
      if (uploadError) {
        setError('Error uploading image: ' + uploadError.message);
        return;
      }

      // Retrieve the public URL.
      const {
        data: { publicUrl },
        error: publicUrlError,
      } = supabase.storage.from('space-images').getPublicUrl(filePath);
      if (publicUrlError) {
        setError('Error retrieving image URL: ' + publicUrlError.message);
        return;
      }

      // Update the space record with the image URL.
      const { error: updateError } = await supabase
        .from('spaces')
        .update({ image_url: publicUrl })
        .eq('id', spaceId);
      if (updateError) {
        setError('Error updating space record: ' + updateError.message);
        return;
      }

      setSuccess('Image uploaded successfully.');
    } catch (err) {
      setError('Unexpected error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='glow-box'>
      <label className='block text-sm font-semibold mb-1'>Space Image</label>
      <input
        type='file'
        accept='image/jpeg, image/png, image/gif'
        onChange={handleFileChange}
        className='border p-2 w-full'
      />
      {error && <p className='mt-2 text-sm text-red-400'>{error}</p>}
      {success && <p className='mt-2 text-sm text-green-400'>{success}</p>}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className='glow-button mt-4'>
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>
    </div>
  );
}
