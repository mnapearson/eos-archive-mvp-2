'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Menu from './Menu'; // Import the Menu component
import { FilterContext } from '@/contexts/FilterContext'; // Import filter context
import { supabase } from '@/lib/supabaseClient';
// Custom hook to subscribe to auth state changes
function useUserSimple() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  return user;
}

export default function NavBar() {
  const { setSelectedFilters } = useContext(FilterContext);
  const [theme, setTheme] = useState('dawn');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const user = useUserSimple();

  // Load saved theme or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setTheme(prefersDark ? 'dusk' : 'dawn');
    }
  }, []);

  // Apply theme classes to the document element
  useEffect(() => {
    document.documentElement.classList.remove('dusk', 'dawn');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dawn' ? 'dusk' : 'dawn');
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // When the user clicks the logo (if you decide to have one) you can reset filters:
  const handleLogoClick = () => {
    setSelectedFilters({
      city: [],
      space: [],
      date: [],
      category: [],
      designer: [],
    });
  };

  // Handle search submission: redirect to homepage with the search query.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.push(`/?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <>
      <header className='px-4 fixed top-0 w-full z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b'>
        <div className='py-2 m-2 flex items-center justify-between'>
          {/* Left: spiral that toggles the menu */}

          {/* Center: Logo Homepage */}
          <div className='flex flex-row gap-3 mt-1'>
            <div>
              <button
                onClick={toggleMenu}
                aria-label='Toggle menu'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'>
                  <path
                    fill='currentColor'
                    d='M3 4h18v2H3zm2 15h14v2H5zm-2-5h18v2H3zm2-5h14v2H5z'
                  />
                </svg>
              </button>
            </div>
            <Link
              title='Navigate to homepage'
              href='/'>
              eos archive
            </Link>
          </div>

          {/* Right: Login Button */}
          <div className='flex flex-row gap-3 mt-1'>
            <Link
              title='Show map view'
              href='/map'
              aria-label='Show map view'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='currentColor'>
                <path d='M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9a2 2 0 110-4 2 2 0 010 4z' />
              </svg>
            </Link>

            <Link
              title='Navigate to login page'
              href={user ? '/spaces/admin' : '/login'}
              aria-label='Login or Register'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'>
                <path
                  fill='currentColor'
                  d='M5 20h14v2H5zm7-2a8 8 0 1 1 0-16a8 8 0 0 1 0 16m0-2a6 6 0 1 0 0-12a6 6 0 0 0 0 12'
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Menu Component */}
      <Menu
        title='Open navigation menu'
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />
    </>
  );
}
