'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Filters({ filters, setFilters }) {
  const [cityOptions, setCityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({}); // Stores refs for each dropdown

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

  useEffect(() => {
    function handleClickOutside(event) {
      // Close only if the click is outside all dropdowns
      if (
        activeDropdown &&
        dropdownRefs.current[activeDropdown] &&
        !dropdownRefs.current[activeDropdown].contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const filterOptions = [
    { name: 'city', options: cityOptions },
    { name: 'category', options: categoryOptions },
    { name: 'space', options: spaceOptions },
    { name: 'designer', options: designerOptions },
  ];

  return (
    <div className='flex justify-center gap-4 pb-6'>
      {filterOptions.map(({ name, options }) => (
        <div
          key={name}
          className='relative'
          ref={(el) => (dropdownRefs.current[name] = el)} // Store ref dynamically
        >
          {/* Button to trigger dropdown */}
          <button
            onClick={() =>
              setActiveDropdown(activeDropdown === name ? null : name)
            }
            className={`px-6 py-2 rounded-full border transition-all ${
              filters[name]
                ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                : 'border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]'
            }`}>
            {filters[name] || name.toUpperCase()}
          </button>

          {/* Dropdown Menu */}
          {activeDropdown === name && (
            <div className='absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-[var(--background)] border border-[var(--foreground)] rounded-lg shadow-lg z-50'>
              <ul className='max-h-40 overflow-y-auto'>
                <li
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, [name]: '' }));
                    setActiveDropdown(null);
                  }}
                  className='cursor-pointer p-2 text-center hover:bg-[var(--foreground)] hover:text-[var(--background)]'>
                  ALL
                </li>
                {options.map((option) => (
                  <li
                    key={option}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, [name]: option }));
                      setActiveDropdown(null);
                    }}
                    className='cursor-pointer p-2 text-center hover:bg-[var(--foreground)] hover:text-[var(--background)]'>
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
