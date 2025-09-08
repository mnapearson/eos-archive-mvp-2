'use client';

import { useContext, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FilterContext } from '@/contexts/FilterContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Updated custom hook to subscribe to auth state changes
function useUserSimple() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClientComponentClient();

    // Initial fetch of the session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    // Cleanup the subscription on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return user;
}

function toId(s = '') {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
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

  const panelRef = useRef(null);

  // Focus the panel when opening; lock body scroll
  useEffect(() => {
    if (menuOpen) {
      panelRef.current?.focus();
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') toggleMenu();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, toggleMenu]);

  // Simple focus trap within the panel
  function onPanelKeyDown(e) {
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

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
    router.push(`/?${params.toString()}`, { scroll: false });
    toggleMenu();
  }

  // Helper to render a filter section with accordion behavior and accessibility
  function renderFilterSection(title, category, options) {
    const baseId = `${category}-section`;
    const headingId = `${baseId}-title`;
    const panelId = `${baseId}-panel`;

    return (
      <section
        className='mb-4'
        aria-labelledby={headingId}>
        <button
          type='button'
          id={headingId}
          aria-expanded={openFilters[category]}
          aria-controls={panelId}
          onClick={() => toggleAccordion(category)}
          className='w-full flex items-center justify-between focus:outline-none'>
          <h3 className='font-bold mb-2'>{title.toUpperCase()}</h3>
          <span className='text-xl'>{openFilters[category] ? '−' : '+'}</span>
        </button>
        <div
          id={panelId}
          role='region'
          aria-labelledby={headingId}
          className={`transition-all duration-300 overflow-hidden ${
            openFilters[category] ? 'max-h-96' : 'max-h-0'
          }`}>
          {options.map((item) => {
            const optId = `${category}-${toId(item)}`;
            const checked = selectedFilters[category].includes(item);
            return (
              <div
                key={item}
                className='mb-1 pl-4'>
                <input
                  id={optId}
                  type='checkbox'
                  checked={checked}
                  onChange={() => toggleValue(category, item)}
                  className='mr-2 align-middle'
                />
                <label
                  htmlFor={optId}
                  className='cursor-pointer'>
                  {item.toLowerCase()}
                </label>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='menu-title'
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        menuOpen
          ? 'bg-[var(--background)]/100 opacity-100'
          : 'opacity-0 pointer-events-none'
      }`}>
      {/* Sidebar Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className={`border-r border-[var(--foreground)] fixed left-0 top-0 h-full w-[85vw] max-w-sm sm:w-96 bg-[var(--background)]/75 backdrop-blur-xl backdrop-brightness-75 text-[var(--foreground)] transform transition-transform duration-300 ease-in-out flex flex-col ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Scrollable Content */}
        <div className='flex-grow overflow-y-auto p-6'>
          {/* Header Row: FILTER (left) | CLEAR & SAVE (right) */}
          <div className='flex items-center justify-between mb-4'>
            <h2
              id='menu-title'
              className='text-md font-semibold italic'>
              FILTER
            </h2>
            <div className='flex gap-4'>
              <button
                onClick={handleClear}
                className='button'>
                CLEAR
              </button>
              <button
                onClick={handleSave}
                className='button'>
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
        </div>
        {/* Conditionally render "DASHBOARD" or "LOGIN" link */}
        <div className='m-6'>
          <div>
            <Link
              onClick={toggleMenu}
              href='/map'
              className='block py-1 hover:underline'>
              spaces
            </Link>
            <Link
              onClick={toggleMenu}
              href='/leico'
              className='block py-1 hover:underline'>
              LEICO
            </Link>
            <Link
              onClick={toggleMenu}
              href='/conversations'
              className='block py-1 hover:underline'>
              conversations
            </Link>
            <Link
              onClick={toggleMenu}
              href='/about'
              className='block py-1 hover:underline'>
              about eos archive
            </Link>
          </div>
        </div>
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
