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
      <header className='fixed top-0 inset-x-0 z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b'>
        {/* Skip link for keyboard users */}
        <a
          href='#main'
          className='sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-[var(--foreground)] focus:text-[var(--background)] focus:px-3 focus:py-2'>
          Skip to content
        </a>

        {/* Mobile: 3-col grid; md+: flex like before */}
        <div className='py-2 mx-2 grid grid-cols-3 items-center md:flex md:justify-between'>
          {/* Left: Menu */}
          <div className='justify-self-start md:order-1'>
            <button
              onClick={toggleMenu}
              aria-label='Open menu'
              aria-controls='primary-menu'
              className='px-3 py-2 -mx-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]'>
              menu
            </button>
          </div>

          {/* Center: Brand */}
          <div className='justify-self-center md:order-2'>
            <Link
              href='/'
              title='Navigate to homepage'
              className='px-3 py-2 -mx-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]'>
              eos archive
            </Link>
          </div>

          {/* Right: Actions */}
          <nav
            aria-label='Primary'
            className='justify-self-end flex gap-3 mt-0 md:order-3'>
            <Link
              href='/map'
              title='Show map view'
              aria-label='Show map view'
              className='px-3 py-2 -mx-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]'>
              spaces
            </Link>
            <Link
              href={user ? '/spaces/admin' : '/login'}
              title='Login or Register'
              aria-label='Login or Register'
              className='px-3 py-2 -mx-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)]'>
              login
            </Link>
          </nav>
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
