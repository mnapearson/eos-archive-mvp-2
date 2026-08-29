'use client';

import { useState } from 'react';

// Fetches the pre-generated (and now cached) share card for an event and
// hands it to whichever share path the browser actually supports. Mobile
// Safari/Chrome can share a file directly via the Web Share API — that's
// the real web equivalent of the mobile app's react-native-share path for
// Telegram/WhatsApp (the OS share sheet lets the user pick any installed
// app, Instagram included). Desktop browsers mostly don't support sharing
// files this way, so there it falls back to downloading the card so the
// user can attach it manually.
export default function useShareCard(eventId) {
  const [status, setStatus] = useState('idle');

  const cardUrl = (format) => `/api/events/${eventId}/share-card?format=${format}`;

  async function share(format, caption) {
    setStatus('loading');
    try {
      const res = await fetch(cardUrl(format));
      if (!res.ok) throw new Error('Could not generate the share card.');
      const blob = await res.blob();
      const file = new File([blob], `eos-archive-${eventId}-${format}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        setStatus('idle');
        return { method: 'share' };
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `eos-archive-${eventId}-${format}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      setStatus('idle');
      return { method: 'download' };
    } catch (err) {
      setStatus('idle');
      if (err?.name === 'AbortError') {
        return { method: 'cancelled' };
      }
      throw err;
    }
  }

  return { share, status, cardUrl };
}
