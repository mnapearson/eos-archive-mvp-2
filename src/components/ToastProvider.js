'use client';

import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

// Custom error icon (neon pink border variant)
function ErrorIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='currentColor'>
      <path d='M12 16.462q.262 0 .439-.177q.176-.177.176-.439q0-.261-.177-.438T12 15.23t-.438.177t-.177.438t.177.439t.438.177m-.5-3.308h1v-6h-1zM12.003 21q-1.866 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8' />
    </svg>
  );
}

// Custom success icon (neon green border variant)
function SuccessIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='32'
      height='32'
      viewBox='0 0 32 32'
      fill='currentColor'>
      <path d='M22.8 12.3c.304-.308.304-.808 0-1.12s-.796-.308-1.1 0l-7.75 7.86l-3.6-3.65a.77.77 0 0 0-1.1 0a.8.8 0 0 0 0 1.12l4.15 4.21a.77.77 0 0 0 1.1 0z' />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M32 16c0 8.84-7.16 16-16 16S0 24.84 0 16S7.16 0 16 0s16 7.16 16 16m-1 0c0 8.28-6.72 15-15 15S1 24.28 1 16S7.72 1 16 1s15 6.72 15 15'
      />
    </svg>
  );
}

// Centralized ToastProvider
export default function ToastProvider() {
  return (
    <Toaster
      position='top-center'
      toastOptions={{
        // Base appearance: frosted background, centered, rounded
        className:
          'backdrop-blur-md bg-white/70 dark:bg-black/70 ' +
          'rounded-2xl px-6 py-4 shadow-lg text-gray-900 dark:text-gray-100 ' +
          'max-w-xs w-full mx-auto text-center relative overflow-visible',
        duration: 4000,
        icon: null,
        // Success variant: neon green border + custom icon
        success: {
          icon: <SuccessIcon />,
          style: { border: '2px solid #00ff7f' },
        },
        // Error variant: neon pink border + custom icon
        error: {
          icon: <ErrorIcon />,
          style: { border: '2px solid #ff1493' },
        },
        // custom render wrapper to insert close button & progress bar
        render({ id, message, type }) {
          return (
            <div className='toast-render'>
              {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
              <div className='toast-message'>{message}</div>
              <button
                onClick={() => toast.dismiss(id)}
                className='toast-close'>
                CLOSE
              </button>
              <div className='toast-progress'></div>
            </div>
          );
        },
      }}
      containerClassName='toast-container'
    />
  );
}
