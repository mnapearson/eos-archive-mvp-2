'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Filter from './Filter';

export default function Menu({ menuOpen, toggleMenu }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
      document.body.style.overflow = 'auto';
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        toggleMenu(); // Close if clicked outside
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, toggleMenu]);

  return (
    <div
      className={`fixed inset-0 z-50 backdrop-blur-md transition-all duration-300 ${
        menuOpen
          ? 'bg-[var(--background)]/80 opacity-100'
          : 'opacity-0 pointer-events-none'
      }`}>
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 h-full w-72 bg-[var(--background)] text-[var(--foreground)] shadow-lg p-6 border-r border-gray-300 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Close Button */}
        <button
          className='absolute top-4 right-4'
          onClick={toggleMenu}
          aria-label='Close menu'>
          close
        </button>

        {/* Filters */}
        <h2 className='text-md font-semibold mb-2 italic'>FILTER</h2>
        <Filter toggleMenu={toggleMenu} />

        {/* Navigation Links */}
        <nav className='mt-6'>
          {['about', 'map', 'submission'].map((link) => (
            <Link
              key={link}
              href={`/${link}`}
              className='block py-2'
              onClick={toggleMenu} // Closes menu when a link is clicked
            >
              {link}
            </Link>
          ))}
        </nav>

        {/* Footer Info Inside Menu */}
        <div className='absolute bottom-6 left-0 w-full px-6 text-sm'>
          <a
            href='mailto:hello@eosarchive.app'
            className='block hover:underline mb-2'>
            hello@eosarchive.app
          </a>
          <Link
            href='/privacy'
            className='hover:underline'>
            privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
