import './globals.css';
import NavBar from '@/components/NavBar';
import CookieConsentBar from '@/components/CookieConsentBar';
import { FilterProvider } from '@/contexts/FilterContext';
import Footer from '@/components/Footer';
import ToastProvider from '@/components/ToastProvider';
import Script from 'next/script';
import { SITE } from '@/lib/seo';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s — ${SITE.name}` },
  description: SITE.description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: [{ url: '/icon.png', type: 'image/png' }],
  },
  openGraph: {
    siteName: SITE.name,
    images: [{ url: SITE.ogImage, width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  const plausibleDomain =
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'eosarchive.app';

  return (
    <html lang='en'>
      <body
        className='min-h-screen flex flex-col'
        style={{ overscrollBehaviorX: 'auto' }}
        suppressHydrationWarning>
        {/* Plausible */}
        <Script
          id='plausible'
          strategy='afterInteractive'
          defer
          data-domain={plausibleDomain}
          src='https://plausible.io/js/script.js'
        />

        <FilterProvider>
          <NavBar />
          {/* Page Content */}
          <main className='flex-1 w-full py-4'>
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
