'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Menu from './Menu'; // Importing the new Menu component
import { FilterContext } from '@/contexts/FilterContext'; // Import filter context

export default function NavBar() {
  const { setSelectedFilters } = useContext(FilterContext);
  const [theme, setTheme] = useState('dawn');
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dusk', 'dawn');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dawn' ? 'dusk' : 'dawn');
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // When the logo is clicked, reset the filters and navigate to the homepage.
  const handleLogoClick = () => {
    setSelectedFilters({
      city: [],
      space: [],
      date: [],
      category: [],
      designer: [],
    });
  };

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 px-4 border-b border-gray-200 backdrop-blur-md transition-all ${
          isScrolled ? 'bg-[var(--background)]/80' : 'bg-transparent'
        }`}>
        <div className='max-w-6xl mx-auto py-4 flex items-center justify-between'>
          {/* Left: Menu Button */}
          <button
            className='w-1/3 flex items-center space-x-6'
            onClick={toggleMenu}
            aria-label='Toggle menu'>
            menu
          </button>

          {/* Center: Logo */}
          <div className='w-1/3 flex justify-center'>
            <Link
              href='/'
              onClick={handleLogoClick}>
              <Image
                src='https://mqtcodpajykyvodmahlt.supabase.co/storage/v1/object/public/assets/EOS24_metal_blue_transparent.png'
                alt='eos archive logo'
                width={120}
                height={40}
                priority
              />
            </Link>
          </div>

          {/* Right: Dusk/Dawn Toggle */}
          <div className='w-1/3 flex justify-end'>
            <button
              onClick={toggleTheme}
              aria-label='Toggle Theme'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='inline-block'>
                <g fill='currentColor'>
                  <path d='M12 16a4 4 0 0 0 0-8z'></path>
                  <path
                    fillRule='evenodd'
                    d='M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m0 2v4a4 4 0 1 0 0 8v4a8 8 0 1 0 0-16'
                    clipRule='evenodd'></path>
                </g>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Menu Component (Controls the open/close state from NavBar) */}
      <Menu
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />
    </>
  );
}
