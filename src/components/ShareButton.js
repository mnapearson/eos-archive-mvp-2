// src/components/ShareButton.js
'use client';

import React from 'react';

export default function ShareButton({
  title,
  text,
  buttonText = 'Share',
  className = '',
  onError,
}) {
  const handleShare = async () => {
    try {
      // Determine share URL: use provided url or fallback to current page
      const shareUrl = window.location.href;
      // Use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
      } else {
        // Fallback: copy the URL to the clipboard
        await navigator.clipboard.writeText(shareUrl);
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
