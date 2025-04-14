// src/components/ShareButton.js
'use client';

import React from 'react';

/**
 * ShareButton Component
 *
 * A reusable component to share content using the Web Share API if available,
 * and falling back to copying the share URL to the clipboard.
 *
 * Props:
 * - title: The title for the shared content (e.g., event title)
 * - text: Additional text to share (e.g., event description, details)
 * - url: The URL to share
 * - buttonText: (Optional) Text for the button (default: "Share")
 * - className: (Optional) Additional CSS classNames for styling
 * - onError: (Optional) Callback function for handling errors
 */
export default function ShareButton({
  title,
  text,
  url,
  buttonText = 'Share',
  className = '',
  onError,
}) {
  const handleShare = async () => {
    try {
      // Use the Web Share API if it's available
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
      } else {
        // Fallback: copy the URL to the clipboard
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (onError) onError(error);
      alert('Error sharing, please try again.');
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`glow-button ${className}`}>
      {buttonText}
    </button>
  );
}
