// CookieConsentBar.js
'use client';

import { useEffect, useState } from 'react';

export default function CookieConsentBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className='fixed bottom-0 left-0 right-0 bg-[var(--background)]/80 backdrop-blur-md
      border-t border-[var(--foreground)] text-[var(--foreground)] p-6 z-50 flex
      items-center justify-between'>
      <p className='text-sm mr-4'>
        We use only essential cookies necessary for site functionality.
      </p>
      <button
        onClick={handleAccept}
        className='underline text-sm hover:opacity-80'>
        OK
      </button>
    </div>
  );
}
