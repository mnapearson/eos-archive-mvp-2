'use client';
import Script from 'next/script';

export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN; // e.g. "eosarchive.app, your-temp.netlify.app"
  if (!domain) return null;
  return (
    <Script
      id='plausible-script'
      defer
      data-domain={domain}
      src='https://plausible.io/js/script.js'
      strategy='afterInteractive'
    />
  );
}
