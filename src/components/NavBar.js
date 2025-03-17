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
        <div className='max-w-6xl mx-auto py-4 px-4 flex items-center justify-between'>
          {/* Left: EOS logo that toggles the menu */}
          <div className='pointer-events-auto bg-[var(--background)]/90 backdrop-blur-xl px-4 py-2 rounded-full'>
            <button
              onClick={toggleMenu}
              aria-label='Toggle menu'
              className='flex items-center justify-center'>
              <Image
                src='https://mqtcodpajykyvodmahlt.supabase.co/storage/v1/object/public/assets/EOS24_metal_blue_transparent.png'
                alt='Toggle menu'
                width={80}
                height={40}
                priority
              />
            </button>
          </div>

          {/* Center: Search Bar
          <div className='pointer-events-auto bg-[var(--background)]/80 backdrop-blur-xl px-4 py-2 rounded-full flex-grow mx-4 max-w-lg'>
            <form
              onSubmit={handleSearchSubmit}
              className='w-full px-4 py-2'>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search by city, space, category, or designer'
                className='w-full bg-transparent outline-none placeholder:text-[var(--foreground)] text-[var(--foreground)]'
              />
            </form>
          </div> */}

          {/* Right: Theme Toggle */}
          <div className='pointer-events-auto bg-[var(--background)]/90 backdrop-blur-xl px-4 py-2 rounded-full'>
            <button
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
            </button>
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
