'use client';

import GeneratedFlyerCard from '@/components/GeneratedFlyerCard';

// Single resolution path for wherever an event flyer renders (Explore grid,
// space detail event list, admin panel, event detail page) so the
// precedence logic and fallback component can't drift between call sites.
//
// Order:
//   1. image_url — owner-uploaded, via /api/events/upload-image.
//   2. flyer_image_url — Airtable-synced.
//   3. Generated fallback card.
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

  return (
    <GeneratedFlyerCard
      event={event}
      spaceCategory={spaceCategory}
      className={fallbackClassName}
    />
  );
}
