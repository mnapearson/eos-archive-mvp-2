'use client';

import './globals.css';
import NavBar from '@/components/NavBar';
import CookieConsentBar from '@/components/CookieConsentBar';
import { FilterProvider } from '@/contexts/FilterContext';
import Footer from '@/components/Footer';
import ToastProvider from '@/components/ToastProvider';
import Analytics from '@/components/Analytics';

export default function RootLayout({ children }) {
  // State for theme (default to system preference)

  return (
    <html lang='en'>
      <body className='min-h-screen flex flex-col'>
        <FilterProvider>
          <Analytics />
          <NavBar />
          {/* Page Content */}
          <main className='w-full px-4 py-2 flex-1'>
            <div className='page-content'>{children}</div>
          </main>
          <Footer />
          {/* global toast container */}
          <ToastProvider />
        </FilterProvider>
        <CookieConsentBar />
      </body>
    </html>
  );
}
