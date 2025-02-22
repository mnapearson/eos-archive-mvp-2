'use client';

import { useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FilterContext } from '@/contexts/FilterContext';

export default function Filters({ toggleMenu }) {
  const {
    cityOptions,
    categoryOptions,
    spaceOptions,
    designerOptions,
    filters,
    setFilters,
  } = useContext(FilterContext);

  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRefs = useRef({});

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Utility to update the URL query parameters based on current filters
  const updateUrlWithFilters = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    router.push(`/?${params.toString()}`);
  };

  // Handle filter selection: update context, close dropdown, update URL, and close menu if needed
  const handleFilterSelect = (name, option) => {
    const newFilters = { ...filters, [name]: option };
    setFilters(newFilters);
    setActiveDropdown(null);
    updateUrlWithFilters(newFilters);
    if (toggleMenu) {
      toggleMenu();
    }
  };

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
          ref={(el) => (dropdownRefs.current[name] = el)}>
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

          {activeDropdown === name && (
            <div className='absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-[var(--background)] border border-[var(--foreground)] rounded-lg shadow-lg z-50'>
              <ul className='max-h-40 overflow-y-auto'>
                <li
                  onClick={() => handleFilterSelect(name, '')}
                  className='cursor-pointer p-2 text-center hover:bg-[var(--foreground)] hover:text-[var(--background)]'>
                  ALL
                </li>
                {options.map((option) => (
                  <li
                    key={option}
                    onClick={() => handleFilterSelect(name, option)}
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
