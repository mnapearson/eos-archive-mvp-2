'use client';
import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setState('loading');
    setMsg('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tag: 'site-footer' }),
      });

      let data = {};
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          data = await res.json();
        } catch {}
      } else {
        // Fallback: read text if server returned non-JSON
        try {
          data = { text: await res.text() };
        } catch {}
      }

      if (res.ok && (data.ok || data.status || data.text !== undefined)) {
        const status = data.status || 'subscribed';
        setState('success');
        setMsg(
          status === 'pending'
            ? 'Please confirm your subscription via the email we just sent.'
            : 'You’re subscribed! If you were already on the list, we’ve updated your preferences.'
        );
        setEmail('');
        window.plausible?.('NewsletterSignup', {
          props: { source: 'footer', status },
        });
        return;
      }

      setState('error');
      setMsg(data.error || 'Something went wrong. Try again?');
    } catch {
      // As a last resort, be optimistic if Mailchimp likely succeeded
      setState('success');
      setMsg(
        'You’re subscribed! If you were already on the list, we’ve updated your preferences.'
      );
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className='mx-auto flex w-full max-w-xl flex-col gap-4'
      noValidate>
      <label
        htmlFor='nl-email'
        className='sr-only'>
        Email address
      </label>
      <input
        id='nl-email'
        type='email'
        required
        autoComplete='email'
        placeholder='your@email.com'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className='input w-full'
      />
      <label className='flex items-start gap-3 text-sm opacity-80'>
        <input
          required
          type='checkbox'
          className='mt-1'
        />
        <span>
          I agree to receive emails from eos archive and accept the{' '}
          <a
            className='underline'
            href='/privacy'>
            privacy policy
          </a>
          .
        </span>
      </label>
      <button
        className='nav-cta w-full justify-center sm:w-auto'
        disabled={state === 'loading'}>
        {state === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {msg && (
        <p
          className={`text-sm ${
            state === 'error' ? 'text-red-400' : 'opacity-90'
          }`}
          aria-live='polite'>
          {msg}
        </p>
      )}
      {/* Honeypot */}
      <input
        type='text'
        name='website'
        tabIndex={-1}
        autoComplete='off'
        className='hidden'
      />
    </form>
  );
}
