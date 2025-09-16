'use client';

import './globals.css';
import NavBar from '@/components/NavBar';
import CookieConsentBar from '@/components/CookieConsentBar';
import { FilterProvider } from '@/contexts/FilterContext';
import Footer from '@/components/Footer';
import ToastProvider from '@/components/ToastProvider';

export default function RootLayout({ children }) {
  // State for theme (default to system preference)

  return (
    <html lang='en'>
      <head>
        {/* Plausible: render server-side so the checker sees it */}
        <script
          defer
          data-domain='eosarchive.app'
          src='https://plausible.io/js/script.js'></script>
        <title>eos archive</title>
        <meta
          name='description'
          content='eos is a living archive of event culture — curated graphics from the independent scene.'
        />
        <link
          rel='canonical'
          href='https://eosarchive.app/'
        />
        <meta
          name='robots'
          content='index,follow'
        />

        {/* Open Graph */}
        <meta
          property='og:title'
          content='eos archive'
        />
        <meta
          property='og:description'
          content='eos is a living archive of event culture — curated graphics from the independent scene.'
        />
        <meta
          property='og:type'
          content='website'
        />
        <meta
          property='og:url'
          content='https://eosarchive.app/'
        />
        <meta
          property='og:site_name'
          content='eos archive'
        />
        <meta
          property='og:image'
          content='/og.png'
        />
        <meta
          property='og:image:width'
          content='1200'
        />
        <meta
          property='og:image:height'
          content='630'
        />

        {/* Twitter */}
        <meta
          name='twitter:card'
          content='summary_large_image'
        />
        <meta
          name='twitter:title'
          content='eos archive'
        />
        <meta
          name='twitter:description'
          content='eos is a living archive of event culture — curated graphics from the independent scene.'
        />
        <meta
          name='twitter:image'
          content='/og.png'
        />
      </head>
      <body
        className='min-h-screen flex flex-col'
        style={{ overscrollBehaviorX: 'auto' }}
        suppressHydrationWarning>
        <FilterProvider>
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
