'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Filters({ filters, setFilters }) {
  const [cityOptions, setCityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);

  useEffect(() => {
    async function fetchOptions() {
      const { data: events } = await supabase
        .from('events')
        .select('city, category, space, designer');

      const unique = (key) => [
        ...new Set(events?.map((item) => item[key]).filter(Boolean)),
      ];

      setCityOptions(unique('city'));
      setCategoryOptions(unique('category'));
      setSpaceOptions(unique('space'));
      setDesignerOptions(unique('designer'));
    }

    fetchOptions();
  }, []);

  return (
    <div className='flex justify-center gap-4 py-4'>
      {[
        { name: 'city', options: cityOptions },
        { name: 'category', options: categoryOptions },
        { name: 'space', options: spaceOptions },
        { name: 'designer', options: designerOptions },
      ].map(({ name, options }) => (
        <select
          key={name}
          className='px-4 py-2 bg-transparent rounded'
          value={filters[name]}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, [name]: e.target.value }))
          }>
          <option value=''>{name.toUpperCase()}</option>
          {options.map((option) => (
            <option
              key={option}
              value={option}>
              {option}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
