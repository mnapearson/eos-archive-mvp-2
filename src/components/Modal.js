'use client';
import { useEffect, useRef } from 'react';

/**
 * Modal — accessible, lightweight dialog
 *
 * Props:
 *  - open: boolean — controls visibility
 *  - onClose: () => void — called on ESC key or backdrop click
 *  - children: ReactNode — modal content
 *  - label: string — accessible name for the dialog (default: 'Dialog')
 */
export default function Modal({ open, onClose, children, label = 'Dialog' }) {
  const ref = useRef(null);

  // Lock body scroll and bind ESC while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    // focus the dialog container for screen readers / ESC
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--background)_35%,transparent)]'
      onClick={onBackdrop}
      aria-hidden='true'>
      <div
        role='dialog'
        aria-modal='true'
        aria-label={label}
        ref={ref}
        tabIndex={-1}
        className='mx-auto my-8 w-[min(720px,92vw)] max-h-[90vh] overflow-auto rounded-xl p-4 shadow-2xl outline-none border border-[color-mix(in_oklab,var(--foreground)_20%,transparent)] bg-[color-mix(in_oklab,var(--background)_60%,transparent)] backdrop-blur-xl'>
        <button
          onClick={onClose}
          className='float-right text-sm opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/30 rounded px-2 py-1'
          aria-label='Close dialog'>
          close
        </button>
        <div className='clear-both' />
        {children}
      </div>
    </div>
  );
}
