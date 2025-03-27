'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Menu from './Menu'; // Import the Menu component
import { FilterContext } from '@/contexts/FilterContext'; // Import filter context

export default function NavBar() {
  const { setSelectedFilters } = useContext(FilterContext);
  const [theme, setTheme] = useState('dawn');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

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
      <header className='fixed top-0 w-full z-50 text-[var(--foreground)] pointer-events-none'>
        <div className='max-w-6xl mx-auto py-4 flex items-center justify-between'>
          {/* Left: spiral that toggles the menu */}
          <div className='pointer-events-auto bg-[var(--background)]/90 backdrop-blur-xl px-4 py-2 rounded-full'>
            <button
              onClick={toggleMenu}
              aria-label='Toggle menu'
              className='flex items-center justify-center gap-2'>
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
              menu
            </button>
          </div>

          {/* Center: Logo Homepage */}
          <div className='pointer-events-auto bg-[var(--background)]/80 backdrop-blur-xl px-4 py-2 rounded-full'>
            <Link
              className='flex items-center justify-center'
              href='/'>
              <img
                width='125'
                src='https://mqtcodpajykyvodmahlt.supabase.co/storage/v1/object/public/assets//EOS24_metal_blue_transparent.png'></img>
            </Link>
          </div>

          {/* Right: Login Button */}
          <div className='pointer-events-auto bg-[var(--background)]/90 backdrop-blur-xl px-4 py-2 rounded-full'>
            <Link
              className='flex items-center justify-center gap-2'
              href='/login'>
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
            {/*  <button
              onClick={toggleTheme}
              aria-label='Toggle Theme'
              className='text-sm font-semibold flex items-center p-1'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='30'
                height='30'
                fill='currentColor'
                viewBox='0 0 24 24'>
                <path d='M12 16a4 4 0 0 0 0-8z'></path>
                <path
                  fillRule='evenodd'
                  d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m0 2v4a4 4 0 1 0 0 8v4a8 8 0 1 0 0-16'
                  clipRule='evenodd'></path>
              </svg>
            </button>*/}
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
