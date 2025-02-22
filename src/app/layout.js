'use client';

import Link from 'next/link';
import './globals.css';
import NavBar from '@/components/NavBar';
import { FilterProvider } from '@/contexts/FilterContext';

export default function RootLayout({ children }) {
  // State for theme (default to system preference)

  return (
    <html lang='en'>
      <body className='min-h-screen flex flex-col'>
        <FilterProvider>
          {/* NavBar */}
          <NavBar />

          {/* Page Content */}
          {/* Page Content */}
          <main className='flex-grow px-4 py-40'>{children}</main>

          <footer className='w-full border-t border-gray-200 px-4'>
            <div className='max-w-6xl mx-auto py-4 flex flex-col md:flex-row items-center justify-between'>
              <p className='text-sm'>
                © {new Date().getFullYear()} eos archive
              </p>
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
        </FilterProvider>
      </body>
    </html>
  );
}
