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
        <div className='container py-2 flex items-center justify-between'>
          {/* Left: spiral that toggles the menu */}
          <div>
            <button
              className='flex flex-row gap-1'
              onClick={toggleMenu}
              aria-label='Toggle menu'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'>
                <path
                  fill='none'
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='1'
                  d='M11.953 2C17.502 2 22 6.477 22 12s-4.498 10-10.047 10C-.63 22-1.827 4.018 11.5 5c3.35.247 6.53 3.41 6.53 7c0 4.5-2.794 6.5-6.53 6.5c-7 0-8.31-10.033-.498-9.5c1.506.103 3.014 1.343 3.014 3c0 1.928-1.016 3-2.895 3'
                  color='currentColor'
                />
              </svg>
              <p>menu</p>
            </button>
          </div>

          {/* Center: Logo Homepage */}
          <div>
            <Link href='/'>
              <img
                width='125'
                src='https://mqtcodpajykyvodmahlt.supabase.co/storage/v1/object/public/assets//EOS24_metal_blue_transparent.png'></img>
            </Link>
          </div>

          {/* Right: Login Button */}
          <div>
            <Link
              href={user ? '/spaces/admin' : '/login'}
              className='flex flex-row gap-1'>
              connect
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'>
                <path
                  fill='currentColor'
                  d='M10.5 13h-7c-.3 0-.5.2-.5.5v7c0 .3.2.5.5.5h7c.3 0 .5-.2.5-.5v-7c0-.3-.2-.5-.5-.5m-.5 7H4v-6h6zm.5-17h-7c-.3 0-.5.2-.5.5v7c0 .3.2.5.5.5h7c.3 0 .5-.2.5-.5v-7c0-.3-.2-.5-.5-.5m-.5 7H4V4h6zm10.5-7h-7c-.3 0-.5.2-.5.5v7c0 .3.2.5.5.5h7c.3 0 .5-.2.5-.5v-7c0-.3-.2-.5-.5-.5m-.5 7h-6V4h6zm.5 6.5h-3v-3c0-.3-.2-.5-.5-.5s-.5.2-.5.5v3h-3c-.3 0-.5.2-.5.5s.2.5.5.5h3v3c0 .3.2.5.5.5s.5-.2.5-.5v-3h3c.3 0 .5-.2.5-.5s-.2-.5-.5-.5'
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
