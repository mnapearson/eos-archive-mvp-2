'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DynamicSubmissionForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    city: '',
    title: '',
    date: '',
    time: '',
    category: '',
    designer: '',
    space: '',
    latitude: '',
    longitude: '',
    description: '',
    spaceType: '', // New field for space type
  });
  const [imageFile, setImageFile] = useState(null);
  const [agreed, setAgreed] = useState(false); // Terms and Conditions checkbox
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Dynamic options fetched from Supabase
  const [cityOptions, setCityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);

  // Suggestion lists for each field
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [designerSuggestions, setDesignerSuggestions] = useState([]);
  const [spaceSuggestions, setSpaceSuggestions] = useState([]);

  // Refs for suggestion dropdowns
  const cityRef = useRef(null);
  const categoryRef = useRef(null);
  const designerRef = useRef(null);
  const spaceRef = useRef(null);

  // Fetch distinct options on mount.
  useEffect(() => {
    async function fetchOptions() {
      // Fetch Cities from the spaces table.
      const { data: cityData, error: cityError } = await supabase
        .from('spaces')
        .select('city');
      if (cityError) console.error('Error fetching cities:', cityError);
      const uniqueCities = [
        ...new Set(cityData?.map((item) => item.city).filter(Boolean)),
      ];
      setCityOptions(uniqueCities);

      // Fetch Categories from the events table.
      const { data: catData } = await supabase
        .from('events')
        .select('category');
      const uniqueCategories = [
        ...new Set(catData?.map((item) => item.category).filter(Boolean)),
      ];
      setCategoryOptions(uniqueCategories);

      // Fetch Designers from the events table.
      const { data: designerData } = await supabase
        .from('events')
        .select('designer');
      const uniqueDesigners = [
        ...new Set(designerData?.map((item) => item.designer).filter(Boolean)),
      ];
      setDesignerOptions(uniqueDesigners);

      // Fetch Spaces from the spaces table (with latitude, longitude, city, and type)
      const { data: spaceData, error: spaceError } = await supabase
        .from('spaces')
        .select('name, latitude, longitude, city, type');
      if (spaceError) console.error('Error fetching spaces:', spaceError);
      // Normalize each record with a "space" property equal to the name
      const normalizedSpaces =
        spaceData?.map((item) => ({
          space: item.name,
          latitude: item.latitude,
          longitude: item.longitude,
          city: item.city,
          spaceType: item.type, // Include space type
        })) || [];
      setSpaceOptions(normalizedSpaces);
    }
    fetchOptions();
  }, []);

  // Global click handler to close suggestion lists when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setCitySuggestions([]);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategorySuggestions([]);
      }
      if (designerRef.current && !designerRef.current.contains(event.target)) {
        setDesignerSuggestions([]);
      }
      if (spaceRef.current && !spaceRef.current.contains(event.target)) {
        setSpaceSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handler for input changes and updating suggestions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'city') {
      setCitySuggestions(
        value.length
          ? cityOptions.filter((opt) =>
              opt.toLowerCase().startsWith(value.toLowerCase())
            )
          : []
      );
    }
    if (name === 'category') {
      setCategorySuggestions(
        value.length
          ? categoryOptions.filter((opt) =>
              opt.toLowerCase().startsWith(value.toLowerCase())
            )
          : []
      );
    }
    if (name === 'designer') {
      setDesignerSuggestions(
        value.length
          ? designerOptions.filter((opt) =>
              opt.toLowerCase().startsWith(value.toLowerCase())
            )
          : []
      );
    }
    if (name === 'space') {
      setSpaceSuggestions(
        value.length
          ? spaceOptions.filter((opt) =>
              opt.space.toLowerCase().startsWith(value.toLowerCase())
            )
          : []
      );
    }
  };

  const handleFocus = (field) => {
    if (field === 'city' && formData.city.trim() === '') {
      setCitySuggestions(cityOptions);
    }
    if (field === 'category' && formData.category.trim() === '') {
      setCategorySuggestions(categoryOptions);
    }
    if (field === 'designer' && formData.designer.trim() === '') {
      setDesignerSuggestions(designerOptions);
    }
    if (field === 'space' && formData.space.trim() === '') {
      setSpaceSuggestions(spaceOptions);
    }
  };

  const handleSuggestionSelect = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'city') {
      setCitySuggestions([]);
    } else if (field === 'category') {
      setCategorySuggestions([]);
    } else if (field === 'designer') {
      setDesignerSuggestions([]);
    } else if (field === 'space') {
      setSpaceSuggestions([]);
      const selected = spaceOptions.find((opt) => opt.space === value);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          latitude: selected.latitude ? selected.latitude.toString() : '',
          longitude: selected.longitude ? selected.longitude.toString() : '',
          city: selected.city || prev.city,
          spaceType: selected.spaceType || '', // Auto-fill space type if available
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          latitude: '',
          longitude: '',
          spaceType: '',
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5242880; // 5MB
      if (file.size > maxSize) {
        alert('File size exceeds 5MB. Please choose a smaller file.');
        return;
      }
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!agreed) {
      setError('You must agree to the Terms and Conditions to submit.');
      return;
    }

    // Fallback: if latitude or longitude are empty, try to fetch them based on the city
    let lat = formData.latitude;
    let lng = formData.longitude;
    if ((!lat || !lng) && formData.city) {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            formData.city
          )}.json?access_token=${mapboxToken}`
        );
        const geoData = await res.json();
        if (geoData.features && geoData.features.length > 0) {
          const [fLng, fLat] = geoData.features[0].center;
          lat = fLat;
          lng = fLng;
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }

    // Check if the space already exists in the new "spaces" table (match on name and city)
    const { data: existingSpaces, error: spaceError } = await supabase
      .from('spaces')
      .select('id')
      .eq('name', formData.space)
      .eq('city', formData.city)
      .limit(1);

    let spaceId;
    if (existingSpaces && existingSpaces.length > 0) {
      spaceId = existingSpaces[0].id;
    } else {
      // If spaceType is empty, set it to null.
      const newSpaceType =
        formData.spaceType === '' ? null : formData.spaceType;
      const { data: newSpace, error: insertSpaceError } = await supabase
        .from('spaces')
        .insert([
          {
            name: formData.space,
            city: formData.city,
            type: newSpaceType,
            latitude: Number(lat),
            longitude: Number(lng),
          },
        ])
        .select();
      if (insertSpaceError) {
        console.error('Error inserting new space:', insertSpaceError);
        setError('Error submitting your event. Please try again.');
        return;
      }
      spaceId = newSpace[0].id;
    }

    // Remove fields that now belong to the spaces table.
    const { city, space, spaceType, latitude, longitude, ...eventData } =
      formData;

    const dataToInsert = {
      ...eventData,
      space_id: spaceId, // Reference the space record
      approved: false,
      image_url: null,
    };

    // Upload image if provided
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

    const { error: insertError } = await supabase
      .from('events')
      .insert([dataToInsert]);
    if (insertError) {
      console.error('Error inserting event:', insertError);
      setError(
        'There was an error submitting your event. Please review the required fields and contact hello@eosarchive.app if the error persists.'
      );
      return;
    }

    // Reset form after submission
    setFormData({
      city: '',
      title: '',
      date: '',
      time: '',
      category: '',
      designer: '',
      space: '',
      latitude: '',
      longitude: '',
      description: '',
      spaceType: '',
    });
    setImageFile(null);
    router.push('/submission-success');
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-[var(--background)] text-[var(--foreground)]'>
      <div className='max-w-2xl w-full bg-[var(--background)] '>
        <h1 className='font-semibold mb-6 uppercase tracking-wide'>
          SUBMIT AN EVENT
        </h1>

        <form
          onSubmit={handleSubmit}
          className='grid gap-6'>
          {/* Space Field */}
          <div className='relative'>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Space
            </label>
            <input
              type='text'
              name='space'
              value={formData.space}
              onChange={handleInputChange}
              onFocus={() => handleFocus('space')}
              placeholder='Select or type a space'
              required
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
              autoComplete='off'
            />
            {spaceSuggestions.length > 0 && (
              <ul
                ref={spaceRef}
                className='absolute left-0 right-0 bg-[var(--background)] border border-[var(--foreground)] shadow-lg z-50 mt-1 max-h-40 overflow-y-auto'>
                {spaceSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.space}
                    onClick={() =>
                      handleSuggestionSelect('space', suggestion.space)
                    }
                    className='p-2 cursor-pointer hover:bg-gray-700'>
                    {suggestion.space}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Space Type Field */}
          <div>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              Space Type
            </label>
            <input
              type='text'
              name='spaceType'
              value={formData.spaceType}
              onChange={handleInputChange}
              placeholder='Enter space type (e.g., gallery, bar, club)'
              readOnly={
                !!formData.space &&
                spaceOptions.find((opt) => opt.space === formData.space)
              }
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
              autoComplete='off'
            />
          </div>

          {/* City Field */}
          <div className='relative'>
            <label className='block mb-1 uppercase tracking-wider text-xs'>
              City
            </label>
            <input
              type='text'
              name='city'
              value={formData.city}
              onChange={handleInputChange}
              onFocus={() => handleFocus('city')}
              placeholder='Select or type a city'
              required
              readOnly={
                !!formData.space &&
                spaceOptions.find((opt) => opt.space === formData.space)
              }
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
              autoComplete='off'
            />
            {citySuggestions.length > 0 && (
              <ul
                ref={cityRef}
                className='absolute left-0 right-0 bg-[var(--background)] border border-[var(--foreground)] shadow-lg z-50 mt-1 max-h-40 overflow-y-auto'>
                {citySuggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    onClick={() => handleSuggestionSelect('city', suggestion)}
                    className='p-2 cursor-pointer hover:bg-gray-700'>
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Latitude & Longitude */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block mb-1 uppercase tracking-wider text-xs'>
                Latitude
              </label>
              <input
                type='text'
                name='latitude'
                value={formData.latitude}
                onChange={handleInputChange}
                readOnly={
                  !!formData.space &&
                  spaceOptions.find((opt) => opt.space === formData.space)
                }
                className='w-full bg-transparent border-b border-[var(--foreground)] p-2'
              />
            </div>
            <div>
              <label className='block mb-1 uppercase tracking-wider text-xs'>
                Longitude
              </label>
              <input
                type='text'
                name='longitude'
                value={formData.longitude}
                onChange={handleInputChange}
                readOnly={
                  !!formData.space &&
                  spaceOptions.find((opt) => opt.space === formData.space)
                }
                className='w-full bg-transparent border-b border-[var(--foreground)] p-2'
              />
            </div>
          </div>

          {/* Title */}
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
              onFocus={() => handleFocus('category')}
              placeholder='Select or type a category'
              required
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
              autoComplete='off'
            />
            {categorySuggestions.length > 0 && (
              <ul
                ref={categoryRef}
                className='absolute left-0 right-0 bg-[var(--background)] border border-[var(--foreground)] shadow-lg z-50 mt-1 max-h-40 overflow-y-auto'>
                {categorySuggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    onClick={() =>
                      handleSuggestionSelect('category', suggestion)
                    }
                    className='p-2 cursor-pointer hover:bg-gray-700'>
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Date */}
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

          {/* Time */}
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
              onFocus={() => handleFocus('designer')}
              placeholder='Select or type a designer'
              required
              className='w-full bg-transparent border-b border-[var(--foreground)] p-2 focus:outline-none'
              autoComplete='off'
            />
            {designerSuggestions.length > 0 && (
              <ul
                ref={designerRef}
                className='absolute left-0 right-0 bg-[var(--background)] border border-[var(--foreground)] shadow-lg z-50 mt-1 max-h-40 overflow-y-auto'>
                {designerSuggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    onClick={() =>
                      handleSuggestionSelect('designer', suggestion)
                    }
                    className='p-2 cursor-pointer hover:bg-gray-700'>
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Description */}
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

          {/* Terms and Conditions Checkbox */}
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
