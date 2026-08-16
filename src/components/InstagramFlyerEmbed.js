'use client';

import { useEffect, useState } from 'react';
import GeneratedFlyerCard from '@/components/GeneratedFlyerCard';
import { hasAcceptedCookies } from '@/components/CookieConsentBar';

const EMBED_SCRIPT_SRC = 'https://www.instagram.com/embed.js';
let embedScriptPromise = null;

// Loads Instagram's embed.js exactly once per page, regardless of how many
// cards mount it — the script itself exposes window.instgrm globally and
// re-injecting the tag on every card would be wasteful and can produce
// duplicate-processing warnings.
function loadEmbedScript() {
  if (window.instgrm) return Promise.resolve();
  if (embedScriptPromise) return embedScriptPromise;

  embedScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${EMBED_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Instagram embed script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Instagram embed script failed to load'));
    document.body.appendChild(script);
  });

  return embedScriptPromise;
}

// Not loaded eagerly on every card in a list view — third-party script with
// its own tracking/cookies, real perf cost at grid scale, and a privacy/
// consent concern this app already gates other things through
// CookieConsentBar.js. Renders GeneratedFlyerCard collapsed by default;
// only swaps in the real embed after an explicit click AND confirmed
// cookie consent. Falls back to GeneratedFlyerCard permanently (not a
// broken iframe/blank space) if the embed script or the post itself fails
// (deleted/private post looks the same as a script failure from here).
export default function InstagramFlyerEmbed({ event, spaceCategory, postUrl, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!expanded || failed) return;
    let cancelled = false;

    loadEmbedScript()
      .then(() => {
        if (cancelled) return;
        window.instgrm?.Embeds?.process();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [expanded, failed]);

  if (failed || !postUrl) {
    return (
      <GeneratedFlyerCard event={event} spaceCategory={spaceCategory} className={className} />
    );
  }

  if (!expanded) {
    return (
      <button
        type='button'
        onClick={() => {
          if (!hasAcceptedCookies()) {
            setNeedsConsent(true);
            return;
          }
          setNeedsConsent(false);
          setExpanded(true);
        }}
        className={`group relative block w-full text-left ${className}`.trim()}
        aria-label='View flyer on Instagram'>
        <GeneratedFlyerCard event={event} spaceCategory={spaceCategory} />
        <span className='pointer-events-none absolute inset-x-3 bottom-3 inline-flex w-fit items-center rounded-full bg-[var(--background)]/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--foreground)] shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur transition group-hover:bg-[var(--background)]'>
          View flyer on Instagram
        </span>
        {needsConsent && (
          <span className='pointer-events-none absolute inset-x-3 top-3 rounded-lg bg-[var(--background)]/90 px-3 py-1.5 text-[10px] leading-relaxed text-[var(--foreground)]/80 shadow-[0_8px_20px_rgba(0,0,0,0.18)]'>
            Accept cookies to view embedded Instagram content.
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl ${className}`.trim()}>
      <blockquote
        className='instagram-media'
        data-instgrm-permalink={postUrl}
        data-instgrm-version='14'
        style={{ margin: 0, width: '100%' }}
      />
    </div>
  );
}
