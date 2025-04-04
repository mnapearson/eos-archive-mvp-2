'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export default function SpaceImageUploader({ spaceId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    // Validate file type and size
    if (selectedFile) {
      if (!selectedFile.type.match(/image\/(jpeg|png)/)) {
        setError('Only JPEG and PNG images are allowed.');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    // Generate a unique file name (e.g., using spaceId and timestamp)
    const fileExt = file.name.split('.').pop();
    const fileName = `${spaceId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('space-images')
      .upload(filePath, file);

    if (uploadError) {
      setError(`Error uploading image: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    // Construct the public URL for the image using the new API:
    const { data } = supabase.storage
      .from('space-images')
      .getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    if (!publicUrl) {
      setError('Error getting public URL.');
      setUploading(false);
      return;
    }

    // Update the space record in your database with the new image URL
    const { error: updateError } = await supabase
      .from('spaces')
      .update({ image_url: publicUrl })
      .eq('id', spaceId);

    if (updateError) {
      setError(`Error updating space: ${updateError.message}`);
    } else {
      // Optionally, inform the user of success, refresh the data, etc.
      alert('Image uploaded and space updated successfully!');
    }
    setUploading(false);
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
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className='glow-button mt-4'>
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>
    </div>
  );
}
