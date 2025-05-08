'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Spinner from '@/components/Spinner';
import { toast } from 'react-hot-toast';

export default function InvitePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (error || profile?.role !== 'admin') {
        router.push('/', { scroll: false });
        return;
      }
      setAuthorized(true);
      setLoading(false);
    }
    checkUser();
  }, [router, supabase]);

  if (loading) {
    return <Spinner />;
  }
  if (!authorized) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLink('');
    try {
      const res = await fetch('/api/generate-signup-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { link: magicLink } = await res.json();
      setLink(magicLink);
      toast.success('Magic link generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate invite link.');
    }
  };

  return (
    <div className='max-w-md mx-auto p-6'>
      <h1 className='text-xl font-bold mb-4'>Create Invite Link</h1>
      <form
        onSubmit={handleSubmit}
        className='space-y-4'>
        <div>
          <label className='block text-sm'>Email</label>
          <input
            type='email'
            required
            className='input mt-1 w-full'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type='submit'
          className='glow-button'>
          Generate Link
        </button>
      </form>
      {link && (
        <div className='mt-4 p-4'>
          <p className='font-medium mb-2'>Here’s your invite link:</p>
          <a
            href={link}
            className='underline break-all text-blue-600'
            target='_blank'
            rel='noopener'>
            {link}
          </a>
        </div>
      )}
    </div>
  );
}
