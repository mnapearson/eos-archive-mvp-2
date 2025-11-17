'use client';

// File: src/components/Footer.js
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import useSupabaseUser from '@/hooks/useSupabaseUser';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const user = useSupabaseUser();
  const registerHref = user ? '/spaces/admin?tab=events' : '/spaces/signup';
  const registerLabel = user ? 'Submit' : 'Register';
  return (
    <footer className='mt-20 border-t border-[var(--foreground)]/20 bg-[var(--background)] text-[var(--foreground)]'>
      <div className='mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 lg:flex-row lg:gap-16'>
        <div className='lg:w-1/3 space-y-4'>
          <span className='ea-label tracking-[0.4em]'>Til dawn</span>
          <p className='max-w-xs text-sm leading-relaxed opacity-75'>
            eos archive preserves the visual memory of independent culture. From
            flyers to conversations, we index the beats of the underground so
            tomorrow remembers what today discovered.
          </p>
          <div className='flex items-center gap-4 text-sm opacity-75'>
            <a
              href='https://instagram.com/eosarchive.app'
              className='flex items-center gap-2 transition hover:opacity-100'
              aria-label='Instagram'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                aria-hidden='true'>
                <g fill='none'>
                  <rect
                    width='17'
                    height='17'
                    x='3.5'
                    y='3.5'
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='1'
                    rx='5.5'
                  />
                  <circle
                    cx='12'
                    cy='12'
                    r='3.606'
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='1'
                  />
                  <circle
                    cx='16.894'
                    cy='7.106'
                    r='1.03'
                    fill='currentColor'
                  />
                </g>
              </svg>
            </a>
            <a
              href='mailto:hello@eosarchive.app'
              className='hover:underline'>
              hello@eosarchive.app
            </a>
          </div>
        </div>

        <div className='lg:w-1/3 space-y-4'>
          <span className='ea-label'>Navigate</span>
          <nav className='grid gap-2 text-sm opacity-80'>
            <Link
              href='/'
              className='hover:underline'>
              Explore
            </Link>
            <Link
              href='/map'
              className='hover:underline'>
              Spaces
            </Link>
            <Link
              href='/conversations'
              className='hover:underline'>
              Conversations
            </Link>
            <Link
              href='/leico'
              className='hover:underline'>
              Leico
            </Link>
            <Link
              href='/about'
              className='hover:underline'>
              About
            </Link>
            <Link
              href={registerHref}
              className='hover:underline'>
              {registerLabel}
            </Link>
            <Link
              href='/support'
              className='hover:underline'>
              Support
            </Link>
          </nav>
        </div>

        <div className='lg:w-1/3 space-y-6'>
          <div
            id='newsletter'
            className='space-y-3'>
            <span className='ea-label'>Join eos news</span>
            <p className='text-sm opacity-70'>
              Monthly highlights: new spaces, flyers, and conversations.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className='border-t border-[var(--foreground)]/15'>
        <div className='mx-auto flex max-w-6xl flex-col-reverse gap-4 px-4 py-6 text-xs uppercase tracking-[0.28em] text-[var(--foreground)]/60 md:flex-row md:items-center md:justify-between'>
          <p>&copy; {currentYear} eos archive. All rights reserved.</p>
          <div className='flex flex-wrap items-center gap-4'>
            <p>Crafted between Leipzig and Berlin.</p>
            <Link
              href='/privacy'
              className='hover:underline'>
              Privacy
            </Link>
            <Link
              href='/terms'
              className='hover:underline'>
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
