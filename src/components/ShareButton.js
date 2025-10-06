// src/components/ShareButton.js
'use client';

import { useEffect, useRef, useState } from 'react';

export default function ShareButton({
  title,
  text,
  url,
  buttonText = 'Share',
  copiedText = 'Copied!',
  className = 'button',
  variant = '',
  children,
  disabled = false,
  onError,
  onSuccess,
}) {
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    if (disabled || pending) return;

    setPending(true);
    const shareUrl = resolveShareUrl(url);
    const shareText = text ? text.trim() : '';
    const clipboardPayload = [shareText, shareUrl].filter(Boolean).join('\n').trim();

    try {
      const copiedSuccessfully = await copyToClipboard(clipboardPayload || shareUrl);

      if (copiedSuccessfully) {
        showCopiedState();
        onSuccess?.();
      } else if (shareUrl && typeof window !== 'undefined') {
        const newWindow = window.open(shareUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          window.location.href = shareUrl;
        }
        onSuccess?.();
      } else {
        throw new Error('Nothing to share.');
      }
    } catch (error) {
      console.error('Share failed:', error);
      onError?.(error);
    } finally {
      setPending(false);
    }
  };

  const showCopiedState = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    setCopied(true);
    resetTimerRef.current = setTimeout(() => setCopied(false), 2200);
  };

  const classes = [className, variant].filter(Boolean).join(' ').trim();
  const label = copied ? copiedText : children ?? buttonText;

  return (
    <button
      type='button'
      onClick={handleShare}
      className={classes}
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      aria-busy={pending}
      aria-live='polite'>
      {label}
    </button>
  );
}

function resolveShareUrl(url) {
  if (url?.startsWith('http')) return url;
  if (typeof window === 'undefined') return '';
  if (!url) return window.location.href;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
}

async function copyToClipboard(text) {
  if (!text) return false;

  if (typeof window === 'undefined') {
    return false;
  }

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Secure clipboard copy failed:', error);
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (error) {
    console.warn('Legacy clipboard copy failed:', error);
    return false;
  }
}
