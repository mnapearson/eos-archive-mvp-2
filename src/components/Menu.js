'use client';

import { useContext, useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FilterContext } from '@/contexts/FilterContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  addMonths,
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
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
    optionCounts,
  } = useContext(FilterContext);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get('search') || '').trim();

  const filterLabels = {
    city: 'City',
    space: 'Space',
    date: 'Date',
    category: 'Category',
    search: 'Search',
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
        isActive: pathname.startsWith('/map') || pathname.startsWith('/spaces'),
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
        href: 'https://donate.stripe.com/3csg0l1N5auLaTmaEF',
        label: 'Support',
        meta: 'Fuel the living archive',
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
    if (searchTerm) {
      pairs.push({ filterKey: 'search', value: searchTerm });
    }
    return pairs;
  }, [selectedFilters, searchTerm]);

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
  });

  useEffect(() => {
    setOpenFilters((prev) => ({
      city: selectedFilters.city.length > 0 || prev.city,
      space: selectedFilters.space.length > 0 || prev.space,
      date: selectedFilters.date.length > 0 || prev.date,
      category: selectedFilters.category.length > 0 || prev.category,
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

  function clearSearchParam() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    const query = params.toString();
    router.replace(query ? `/?${query}` : '/', { scroll: false });
  }

  function removeFilterValue(filterKey, value) {
    if (filterKey === 'search') {
      clearSearchParam();
      return;
    }

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
    });

    if (searchTerm) {
      clearSearchParam();
    }
  }

  // "Save" navigates to the homepage with the selected filters.
  function handleSave() {
    const params = new URLSearchParams();
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        values.forEach((val) => params.append(key, val));
      }
    });
    if (searchTerm) {
      params.append('search', searchTerm);
    }
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
              ? 'max-h-[28rem] py-3 opacity-100'
              : 'max-h-0 py-0 opacity-0'
          }`}
          style={{ overflow: 'hidden' }}>
          {category === 'date' ? (
            <DateCalendar
              counts={optionCounts?.date || {}}
              selectedDates={selectedFilters.date}
              onToggle={(value) => toggleValue('date', value)}
            />
          ) : (
            <div className='flex max-h-52 flex-col gap-2 overflow-y-auto pr-1'>
              {options.map((item) => {
                const optId = `${category}-${toId(item)}`;
                const checked = selectedFilters[category].includes(item);
                const countsForCategory = optionCounts?.[category] || {};
                const count = countsForCategory[item] ?? 0;
                const isDisabled = !checked && count === 0;

                if (!item) return null;

                return (
                  <label
                    key={item}
                    htmlFor={optId}
                    className={`flex items-center justify-between gap-3 text-sm uppercase tracking-[0.18em] ${
                      isDisabled ? 'opacity-40' : 'opacity-80'
                    }`}>
                    <span className='flex items-center gap-3'>
                      <input
                        id={optId}
                        type='checkbox'
                        checked={checked}
                        disabled={isDisabled}
                        onChange={() => toggleValue(category, item)}
                        className='h-4 w-4 accent-[var(--foreground)] disabled:cursor-not-allowed'
                      />
                      <span>{item}</span>
                    </span>
                    <span className='text-[10px] tracking-[0.28em]'>
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
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
        className={`fixed left-0 top-0 flex h-full w-full max-w-none transform flex-col border-r border-[var(--foreground)] bg-[var(--background)]/92 backdrop-blur-xl backdrop-brightness-95 text-[var(--foreground)] transition-transform duration-300 ease-in-out sm:w-96 sm:max-w-sm ${
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
                      <span
                        className='filter-chip__remove'
                        aria-hidden='true'>
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

function DateCalendar({ counts, selectedDates, onToggle }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    if (selectedDates.length > 0) {
      const firstSelected = startOfMonth(new Date(selectedDates[0]));
      setMonth(firstSelected);
    }
  }, [selectedDates]);

  const daysMatrix = useMemo(() => {
    const monthStart = startOfMonth(month);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(month);
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [month]);

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <button
          type='button'
          onClick={() => setMonth((prev) => startOfMonth(addMonths(prev, -1)))}
          className='nav-action px-3 py-1 tracking-[0.24em]'>
          Prev
        </button>
        <span className='ea-label'>{format(month, 'MMMM yyyy')}</span>
        <button
          type='button'
          onClick={() => setMonth((prev) => startOfMonth(addMonths(prev, 1)))}
          className='nav-action px-3 py-1 tracking-[0.24em]'>
          Next
        </button>
      </div>

      <div className='grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-[0.28em] text-[var(--foreground)]/60'>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className='grid grid-cols-7 gap-2 text-sm'>
        {daysMatrix.flat().map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const count = counts[iso] ?? 0;
          const isCurrentMonth = isSameMonth(day, month);
          const isSelected = selectedDates.includes(iso);

          const baseClasses =
            'relative flex h-12 items-center justify-center rounded-2xl border text-xs tracking-[0.18em] transition';
          const stateClasses = isSelected
            ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] shadow-[0_12px_25px_rgba(0,0,0,0.18)]'
            : count > 0
            ? 'border-[var(--foreground)]/25 text-[var(--foreground)] hover:border-[var(--foreground)]'
            : 'border-transparent text-[var(--foreground)]/35';
          const outOfMonth = isCurrentMonth ? '' : 'opacity-40';

          return (
            <button
              key={iso}
              type='button'
              onClick={() => onToggle(iso)}
              disabled={count === 0}
              className={`${baseClasses} ${stateClasses} ${outOfMonth} disabled:cursor-not-allowed disabled:opacity-30`}
              aria-pressed={isSelected}
              aria-label={`${format(day, 'MMMM d, yyyy')} · ${count} event${
                count === 1 ? '' : 's'
              }`}>
              <span>{format(day, 'd')}</span>
              {count > 0 && !isSelected && (
                <span className='absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-[var(--foreground)]/80'></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
