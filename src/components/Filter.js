'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Filter({ onFilterChange }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [cityOptions, setCityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [spaceOptions, setSpaceOptions] = useState([]);
  const [designerOptions, setDesignerOptions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});

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

  const clearFilters = () => {
    router.push(pathname); // Reset URL (removes all filters)
  };

  return (
    <div className='flex flex-col gap-4 mt-4'>
      {/* Clear Filters Button */}
      <div className='flex justify-between items-center mb-2'>
        <h2 className='text-md font-semibold italic'>FILTER</h2>
        <button
          onClick={clearFilters}
          className='text-sm underline text-[var(--foreground)] hover:opacity-70'>
          CLEAR
        </button>
      </div>

      {filterOptions.map(({ name, options }) => {
        const selectedValue = searchParams.get(name) || '';

        return (
          <div
            key={name}
            className='relative'
            ref={(el) => (dropdownRefs.current[name] = el)}>
            {/* Button to trigger dropdown */}
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === name ? null : name)
              }
              className={`w-full text-left px-4 py-2 border-b border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all ${
                selectedValue ? 'font-semibold' : ''
              }`}>
              {selectedValue || name.toUpperCase()}
            </button>

            {/* Dropdown Menu */}
            {activeDropdown === name && (
              <div className='absolute left-0 w-full bg-[var(--background)] border border-[var(--foreground)] rounded-md shadow-lg z-50'>
                <ul className='max-h-40 overflow-y-auto'>
                  <li
                    onClick={() => {
                      onFilterChange(name, '');
                      setActiveDropdown(null);
                    }}
                    className='cursor-pointer p-2 text-left hover:bg-[var(--foreground)] hover:text-[var(--background)]'>
                    ALL
                  </li>
                  {options.map((option) => (
                    <li
                      key={option}
                      onClick={() => {
                        onFilterChange(name, option);
                        setActiveDropdown(null);
                      }}
                      className='cursor-pointer p-2 text-left hover:bg-[var(--foreground)] hover:text-[var(--background)]'>
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
