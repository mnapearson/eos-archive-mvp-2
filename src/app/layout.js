'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './globals.css';
import Image from 'next/image';

export default function RootLayout({ children }) {
  // State for theme (default to system preference)
  const [theme, setTheme] = useState('dawn');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Check localStorage for user preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // If no saved theme, use system preference
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
    // Apply theme class to <html>
    document.documentElement.classList.remove('dusk', 'dawn');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle between themes
  const toggleTheme = () => setTheme(theme === 'dawn' ? 'dusk' : 'dawn');

  return (
    <html lang='en'>
      <body className='min-h-screen flex flex-col'>
        {/* NavBar */}
        <header
          className={`fixed top-0 w-full px-4 border-b border-gray-200 backdrop-blur-md transition-all ${
            isScrolled ? 'bg-[var(--background)]/80' : 'bg-transparent'
          }`}>
          <div className='max-w-6xl mx-auto py-4 flex items-center justify-between'>
            {/* Left: Nav Links */}
            <nav className='w-1/3 flex items-center space-x-6'>
              <Link
                href='/about'
                className='hover:underline'>
                about
              </Link>
              <Link
                href='/map'
                className='hover:underline'>
                spaces
              </Link>
              <Link
                href='/submission'
                className='hover:underline'>
                submit
              </Link>
            </nav>

            {/* Center: Logo (Perfectly Centered) */}
            <div className='w-1/3 flex justify-center'>
              <Link href='/'>
                <Image
                  src='/eos-logo.png'
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

        {/* Page Content */}
        {/* Page Content */}
        <main className='flex-grow px-4 pt-40'>{children}</main>

        <footer className='w-full border-t border-gray-200 px-4'>
          <div className='max-w-6xl mx-auto py-4 flex flex-col md:flex-row items-center justify-between'>
            <p className='text-sm'>© {new Date().getFullYear()} eos archive</p>
            <div className='text-sm mt-2 md:mt-0'>
              <a
                href='mailto:hello@eosarchive.app'
                className='hover:underline'>
                hello@eosarchive.app
              </a>{' '}
              |{' '}
              <Link
                href='/privacy'
                className='hover:underline'>
                privacy
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
