'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d0d',
          color: '#f0f0f0',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          boxSizing: 'border-box',
          textAlign: 'center',
          gap: '16px',
        }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.45 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: '13px', opacity: 0.7, maxWidth: '400px', lineHeight: 1.6 }}>
          {error?.message || 'An unexpected error occurred.'}
        </p>
        {error?.stack && (
          <pre
            style={{
              fontSize: '10px',
              opacity: 0.4,
              maxWidth: '100%',
              overflow: 'auto',
              textAlign: 'left',
              background: 'rgba(255,255,255,0.05)',
              padding: '12px',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
            {error.stack}
          </pre>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: '8px',
            padding: '10px 28px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: '#f0f0f0',
            fontSize: '11px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}>
          Try again
        </button>
      </body>
    </html>
  );
}
