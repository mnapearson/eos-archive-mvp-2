'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CONSENT_STORAGE_KEY = 'cookieConsent';
const CONSENT_TIMESTAMP_KEY = `${CONSENT_STORAGE_KEY}:timestamp`;
const CONSENT_EVENT = 'cookieconsentchange';

export default function CookieConsentBar() {
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!consent) {
        setVisible(true);
      }
    } catch (error) {
      // If localStorage is unavailable (private mode, etc.), keep the banner visible.
      setVisible(true);
    }
  }, []);

  const persistConsent = (status) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, status);
      localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    } catch (error) {
      // Fallback: if storage fails we still proceed, but future visits will surface the banner again.
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CONSENT_EVENT, { detail: { status } })
      );
    }

    setVisible(false);
  };

  const handleAccept = () => persistConsent('accepted');
  const handleReject = () => persistConsent('rejected');
  const toggleDetails = () => setDetailsOpen((prev) => !prev);

  if (!visible) return null;

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-4 z-[60] px-4 sm:bottom-6'>
      <section
        className='pointer-events-auto cookie-banner'
        role='dialog'
        aria-modal='false'
        aria-labelledby='cookie-banner-title'
        aria-describedby='cookie-banner-description'>
        <div className='cookie-banner__header'>
          <div className='cookie-banner__copy'>
            <span
              id='cookie-banner-title'
              className='ea-label cookie-banner__eyebrow'>
              Cookie settings
            </span>
            <p
              id='cookie-banner-description'
              className='cookie-banner__text'>
              We use a minimal set of essential cookies to keep you signed in,
              secure submissions, and remember the dawn/dusk theme. No ads, no
              profiling.
            </p>
          </div>
          <div className='cookie-banner__buttons'>
            <button
              type='button'
              onClick={handleAccept}
              className='cookie-banner__button cookie-banner__button--primary'>
              Accept all
            </button>
            <button
              type='button'
              onClick={handleReject}
              className='cookie-banner__button'>
              Reject non-essential
            </button>
          </div>
        </div>

        <div className='cookie-banner__meta'>
          <button
            type='button'
            onClick={toggleDetails}
            aria-expanded={detailsOpen}
            aria-controls='cookie-banner-details'
            className='cookie-banner__link'>
            {detailsOpen ? 'Hide details' : 'What we use'}
          </button>
          <Link
            href='/privacy'
            className='cookie-banner__link'>
            Privacy notice
          </Link>
        </div>

        {detailsOpen && (
          <div
            id='cookie-banner-details'
            className='cookie-banner__details'>
            <p className='cookie-banner__details-heading'>Essential</p>
            <ul className='cookie-banner__list'>
              <li>
                Supabase session cookies (prefixed with <code>sb-</code>) keep
                you logged in for conversations and space submissions.
              </li>
              <li>
                Local storage remembers the dawn/dusk theme and your cookie
                choice; it never leaves your browser.
              </li>
            </ul>
            <p className='cookie-banner__details-heading'>Analytics</p>
            <p className='cookie-banner__details-copy'>
              Plausible Analytics runs in a cookieless configuration, so there
              are currently no optional tracking cookies to disable.
            </p>
          </div>
        )}

        <p className='cookie-banner__note'>
          Essential cookies remain required for secure login. Rejecting
          non-essential cookies saves your preference and keeps everything else
          running.
        </p>
      </section>
    </div>
  );
}
