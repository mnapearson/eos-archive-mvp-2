'use client';

import Link from 'next/link';
import './globals.css';
import NavBar from '@/components/NavBar';
import CookieConsentBar from '@/components/CookieConsentBar';
import { FilterProvider } from '@/contexts/FilterContext';

export default function RootLayout({ children }) {
  // State for theme (default to system preference)

  return (
    <html lang='en'>
      <body className='min-h-screen flex flex-col'>
        <FilterProvider>
          <NavBar />
          {/* Page Content */}
          <main className='container'>
            <div className='page-content'>{children}</div>
          </main>
        </FilterProvider>
        <CookieConsentBar />
      </body>
    </html>
  );
}
