'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Menu from './Menu'; // Import the Menu component
import { FilterContext } from '@/contexts/FilterContext'; // Import filter context
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Custom hook to subscribe to auth state changes
function useUserSimple() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClientComponentClient();
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
      <header className='fixed top-0 w-full z-50 bg-[var(--background)]/90 backdrop-blur-xl'>
        <div className='container py-2 m-2 flex items-center justify-between'>
          {/* Left: spiral that toggles the menu */}

          {/* Center: Logo Homepage */}
          <div>
            <Link href='/'>eos archive</Link>
          </div>

          {/* Right: Login Button */}
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
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />
    </>
  );
}
