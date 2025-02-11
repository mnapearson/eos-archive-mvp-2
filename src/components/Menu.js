'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Menu({ menuOpen, toggleMenu }) {
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [menuOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 backdrop-blur-md transition-all duration-300 ${
        menuOpen
          ? 'bg-[var(--background)]/80 opacity-100'
          : 'opacity-0 pointer-events-none'
      }`}>
      <div
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
        {['city', 'space', 'date', 'category', 'designer'].map((key) => (
          <select
            key={key}
            className='w-full bg-transparent border-b border-gray-400 py-2 mb-2'>
            <option value=''>{key.toUpperCase()}</option>
            <option value='example'>Example {key}</option>
          </select>
        ))}

        {/* Navigation Links */}
        <nav className='mt-6'>
          <Link
            href='/about'
            className='block py-2'>
            about
          </Link>
          <Link
            href='/map'
            className='block py-2'>
            map
          </Link>
          <Link
            href='/submission'
            className='block py-2'>
            submit
          </Link>
        </nav>
      </div>
    </div>
  );
}
