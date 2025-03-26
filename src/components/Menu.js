'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FilterContext } from '@/contexts/FilterContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Simple custom hook to retrieve the current user session
function useUserSimple() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const supabase = createClientComponentClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);
  return user;
}

export default function Menu({ menuOpen, toggleMenu }) {
  const {
    selectedFilters,
    setSelectedFilters,
    cityOptions,
    spaceOptions,
    dateOptions,
    categoryOptions,
    designerOptions,
  } = useContext(FilterContext);

  const router = useRouter();
  const pathname = usePathname();
  const user = useUserSimple();

  // State to control accordion open/close for each filter category
  const [openFilters, setOpenFilters] = useState({
    city: false,
    space: false,
    date: false,
    category: false,
    designer: false,
  });

  // Toggle a value in an array-based filter (add/remove)
  function toggleValue(category, value) {
    setSelectedFilters((prev) => {
      const current = prev[category] || [];
      return current.includes(value)
        ? { ...prev, [category]: current.filter((v) => v !== value) }
        : { ...prev, [category]: [...current, value] };
    });
  }

  // Toggle accordion open/close for a category
  function toggleAccordion(category) {
    setOpenFilters((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  // Clear all filter selections
  function handleClear() {
    setSelectedFilters({
      city: [],
      space: [],
      date: [],
      category: [],
      designer: [],
    });
    toggleMenu();
  }

  // "Save" navigates to the homepage with the selected filters.
  function handleSave() {
    const params = new URLSearchParams();
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        values.forEach((val) => params.append(key, val));
      }
    });
    router.push(`/?${params.toString()}`);
    toggleMenu();
  }

  // Helper to render a filter section with accordion behavior
  function renderFilterSection(title, category, options) {
    return (
      <div className='mb-4'>
        <button
          onClick={() => toggleAccordion(category)}
          className='w-full flex items-center justify-between focus:outline-none'>
          <h3 className='font-bold mb-2'>{title.toUpperCase()}</h3>
          <span className='text-xl'>{openFilters[category] ? '−' : '+'}</span>
        </button>
        <div
          className={`transition-all duration-300 overflow-hidden ${
            openFilters[category] ? 'max-h-96' : 'max-h-0'
          }`}>
          {options.map((item) => (
            <label
              key={item}
              className='block cursor-pointer mb-1 pl-4'>
              <input
                type='checkbox'
                checked={selectedFilters[category].includes(item)}
                onChange={() => toggleValue(category, item)}
                className='mr-2'
              />
              {item.toLowerCase()}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        menuOpen
          ? 'bg-[var(--background)]/80 backdrop-blur-md opacity-100'
          : 'opacity-0 pointer-events-none'
      }`}>
      {/* Sidebar Panel */}
      <div
        className={`border-x border-[var(--foreground)] fixed left-0 top-0 h-full w-80 bg-[var(--background)]/20 backdrop-blur-md text-[var(--foreground)] transform transition-transform duration-300 ease-in-out flex flex-col ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Scrollable Content */}
        <div className='flex-grow overflow-y-auto p-6'>
          {/* Header Row: FILTER (left) | CLEAR & SAVE (right) */}
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-md font-semibold italic'>FILTER</h2>
            <div className='flex gap-4'>
              <button
                onClick={handleClear}
                className='text-sm'>
                CLEAR
              </button>
              <button
                onClick={handleSave}
                className='text-sm'>
                SAVE
              </button>
            </div>
          </div>

          {/* Render each filter section as an accordion */}
          {renderFilterSection('City', 'city', cityOptions)}
          {renderFilterSection('Space', 'space', spaceOptions)}
          {renderFilterSection('Date', 'date', dateOptions)}
          {renderFilterSection('Category', 'category', categoryOptions)}
          {renderFilterSection('Designer', 'designer', designerOptions)}

          {/* Navigation Links */}
          <div className='mt-6'>
            <Link
              onClick={toggleMenu}
              href='/map'
              className='block py-1'>
              SPACES MAP
            </Link>
            <Link
              onClick={toggleMenu}
              href='/about'
              className='block py-1'>
              ABOUT EOS
            </Link>
            <Link
              onClick={toggleMenu}
              target='blank'
              href='https://www.are.na/eos-archive-4vdklofkovq/conversations-1wumw6beixo'
              className='block py-1'>
              CONVERSATIONS
            </Link>
          </div>
        </div>
        {/* Conditionally render "DASHBOARD" or "LOGIN" link */}
        <div className='m-6'>
          {user ? (
            <Link
              href='/spaces/admin'
              onClick={toggleMenu}>
              DASHBOARD
            </Link>
          ) : (
            <Link
              href='/login'
              onClick={toggleMenu}>
              LOGIN
            </Link>
          )}
        </div>
        {/* Footer */}
        <footer className='w-full border-t border-[var(--foreground)] px-4 py-4'>
          <div className='max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between'>
            <p className='text-sm'>© {new Date().getFullYear()} eos archive</p>
            <div className='text-sm mt-2 md:mt-0'>
              <Link
                href='mailto:hello@eosarchive.app'
                className='hover:underline'>
                hello@eosarchive.app
              </Link>{' '}
              |{' '}
              <Link
                onClick={toggleMenu}
                href='/privacy'
                className='hover:underline'>
                privacy
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Clicking outside the menu closes it */}
      {menuOpen && (
        <div
          className='w-full h-full'
          onClick={toggleMenu}
          aria-hidden='true'
        />
      )}
    </div>
  );
}
