'use client';

import { useContext, useState, useEffect, useRef, useMemo } from 'react';
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
  const pathname = usePathname();

  const filterLabels = {
    city: 'City',
    space: 'Space',
    date: 'Date',
    category: 'Category',
    designer: 'Designer',
  };

  const quickLinks = useMemo(
    () => [
      {
        href: '/',
        label: 'Explore',
        meta: 'Home feed',
        type: 'link',
        isActive: pathname === '/',
      },
      {
        href: '/map',
        label: 'Spaces',
        meta: 'Discover venues',
        type: 'link',
        isActive:
          pathname.startsWith('/map') || pathname.startsWith('/spaces'),
      },
      {
        href: '/conversations',
        label: 'Conversations',
        meta: 'Interviews & essays',
        type: 'link',
        isActive: pathname.startsWith('/conversations'),
      },
      {
        href: '/leico',
        label: 'Leico',
        meta: 'LEICO collaboration',
        type: 'link',
        isActive: pathname.startsWith('/leico'),
      },
      {
        href: '/about',
        label: 'About',
        meta: 'What is eos archive',
        type: 'link',
        isActive: pathname.startsWith('/about'),
      },
      {
        href: 'https://eosarchive.app/spaces/signup',
        label: 'Register a space',
        meta: 'Submit your venue',
        type: 'external',
        isActive: false,
      },
      {
        href: '#newsletter',
        label: 'Newsletter',
        meta: 'Stay updated',
        type: 'anchor',
        isActive: false,
      },
    ],
    [pathname]
  );

  const activeFilterPairs = useMemo(() => {
    const pairs = [];
    Object.entries(selectedFilters).forEach(([filterKey, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        values.forEach((value) => {
          pairs.push({ filterKey, value });
        });
      }
    });
    return pairs;
  }, [selectedFilters]);

  const activeFilterCount = activeFilterPairs.length;
  const hasActiveFilters = activeFilterCount > 0;

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

  useEffect(() => {
    setOpenFilters((prev) => ({
      city: selectedFilters.city.length > 0 || prev.city,
      space: selectedFilters.space.length > 0 || prev.space,
      date: selectedFilters.date.length > 0 || prev.date,
      category: selectedFilters.category.length > 0 || prev.category,
      designer: selectedFilters.designer.length > 0 || prev.designer,
    }));
  }, [selectedFilters]);

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

  function removeFilterValue(filterKey, value) {
    setSelectedFilters((prev) => {
      const current = prev[filterKey] || [];
      return {
        ...prev,
        [filterKey]: current.filter((v) => v !== value),
      };
    });
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
        className='overflow-hidden rounded-2xl border border-[var(--foreground)]/12 bg-[var(--background)]/60'
        aria-labelledby={headingId}>
        <button
          type='button'
          id={headingId}
          aria-expanded={openFilters[category]}
          aria-controls={panelId}
          onClick={() => toggleAccordion(category)}
          className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none'>
          <span className='ea-label'>{title}</span>
          <span className='text-lg font-semibold leading-none'>
            {openFilters[category] ? '–' : '+'}
          </span>
        </button>
        <div
          id={panelId}
          role='region'
          aria-labelledby={headingId}
          aria-hidden={!openFilters[category]}
          className={`px-4 transition-[max-height,opacity,padding] duration-300 ease-out ${
            openFilters[category]
              ? 'max-h-72 py-3 opacity-100'
              : 'max-h-0 py-0 opacity-0'
          }`}
          style={{ overflow: 'hidden' }}>
          <div className='flex flex-col gap-2'>
            {options.map((item) => {
              const optId = `${category}-${toId(item)}`;
              const checked = selectedFilters[category].includes(item);
              return (
                <label
                  key={item}
                  htmlFor={optId}
                  className='flex items-center gap-3 text-sm uppercase tracking-[0.18em] opacity-80'>
                  <input
                    id={optId}
                    type='checkbox'
                    checked={checked}
                    onChange={() => toggleValue(category, item)}
                    className='h-4 w-4 accent-[var(--foreground)]'
                  />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>
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
          : 'pointer-events-none opacity-0'
      }`}>
      {/* Sidebar Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className={`fixed left-0 top-0 flex h-full w-[85vw] max-w-sm transform flex-col border-r border-[var(--foreground)] bg-[var(--background)]/82 backdrop-blur-xl backdrop-brightness-90 text-[var(--foreground)] transition-transform duration-300 ease-in-out sm:w-96 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className='flex-grow overflow-y-auto px-6 py-6 space-y-8'>
          <div className='space-y-3'>
            <h2
              id='menu-title'
              className='ea-label'>
              Navigator
            </h2>
            <div className='grid gap-2'>
              {quickLinks.map((item) => {
                const content = (
                  <>
                    <span className='menu-link__label'>{item.label}</span>
                    {item.meta && (
                      <span className='menu-link__meta'>{item.meta}</span>
                    )}
                  </>
                );

                if (item.type === 'external') {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className='menu-link'
                      data-active={item.isActive ? 'true' : 'false'}
                      onClick={toggleMenu}
                      target='_blank'
                      rel='noreferrer'>
                      {content}
                    </a>
                  );
                }

                if (item.type === 'anchor') {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className='menu-link'
                      data-active='false'
                      onClick={toggleMenu}>
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className='menu-link'
                    data-active={item.isActive ? 'true' : 'false'}
                    prefetch={false}
                    onClick={toggleMenu}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className='space-y-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <span className='ea-label'>Filters</span>
              <span className='text-[10px] uppercase tracking-[0.28em] text-[var(--foreground)]/60'>
                Active {activeFilterCount}
              </span>
            </div>
            {hasActiveFilters && (
              <div className='flex flex-wrap gap-2'>
                {activeFilterPairs.map(({ filterKey, value }, idx) => {
                  const label = filterLabels[filterKey] || filterKey;
                  return (
                    <button
                      key={`${filterKey}-${value}-${idx}`}
                      type='button'
                      className='filter-chip'
                      onClick={() => removeFilterValue(filterKey, value)}>
                      <span>
                        {label}: {value}
                      </span>
                      <span className='filter-chip__remove' aria-hidden='true'>
                        ×
                      </span>
                      <span className='sr-only'>
                        Remove {label.toLowerCase()} filter {value}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {renderFilterSection('City', 'city', cityOptions)}
            {renderFilterSection('Space', 'space', spaceOptions)}
            {renderFilterSection('Date', 'date', dateOptions)}
            {renderFilterSection('Category', 'category', categoryOptions)}
            {renderFilterSection('Designer', 'designer', designerOptions)}
          </div>
        </div>

        <div className='menu-footer px-6 py-4 space-y-3'>
          <button
            type='button'
            onClick={handleSave}
            className='nav-cta w-full justify-center'>
            Apply filters
          </button>
          <div className='menu-footer__row'>
            <button
              type='button'
              onClick={handleClear}
              className='nav-action w-full flex-1 justify-center'>
              Clear all
            </button>
            <button
              type='button'
              onClick={toggleMenu}
              className='nav-action w-full flex-1 justify-center'>
              Close
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className='h-full w-full'
          onClick={toggleMenu}
          aria-hidden='true'
        />
      )}
    </div>
  );
}
