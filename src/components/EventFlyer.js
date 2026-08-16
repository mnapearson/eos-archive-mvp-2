'use client';

import InstagramFlyerEmbed from '@/components/InstagramFlyerEmbed';
import GeneratedFlyerCard from '@/components/GeneratedFlyerCard';

// Single resolution path for wherever an event flyer renders (Explore grid,
// space detail event list, admin panel, event detail page) so the
// precedence logic and fallback components can't drift between call sites.
//
// Order, strict not "whichever's more recent":
//   1. image_url — the field this app's frontend actually reads today
//      (owner-uploaded, via /api/events/upload-image). Existing behavior,
//      unchanged: a real <img>, same as before this component existed.
//   2. flyer_image_url — Airtable-synced, a real separate column that
//      currently has zero rows populated (verified live), so this is
//      currently dormant. Added proactively: this is the exact same
//      never-rendered-field bug already found and fixed once this session
//      for spaces' hero_image_url — adding the fallback now means it
//      starts working the moment Airtable sync populates it, rather than
//      silently doing nothing again.
//   3. instagram_post_url — lazy embed, collapsed by default.
//   4. Generated fallback card.
// A licensed/submitted image should never be displaced by a live embed of
// someone else's post, and this ordering also means instagram_post_url
// getting backfilled onto an event that already has a real flyer can't
// unexpectedly flip its card.
export default function EventFlyer({
  event,
  spaceCategory,
  alt,
  imgClassName = '',
  fallbackClassName = '',
  imgTestId,
}) {
  const directUrl = event?.image_url || event?.flyer_image_url;

  if (directUrl) {
    return (
      <img
        src={directUrl}
        alt={alt || event?.title || 'Event flyer'}
        className={imgClassName}
        loading='lazy'
        data-testid={imgTestId}
      />
    );
  }

  if (event?.instagram_post_url) {
    return (
      <InstagramFlyerEmbed
        event={event}
        spaceCategory={spaceCategory}
        postUrl={event.instagram_post_url}
        className={fallbackClassName}
      />
    );
  }

  return (
    <GeneratedFlyerCard
      event={event}
      spaceCategory={spaceCategory}
      className={fallbackClassName}
    />
  );
}
