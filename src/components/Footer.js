// File: src/components/Footer.js
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className='bg-[var(--background)] text-[var(--foreground)] border-t border-[var(--foreground)] mt-20'>
      <div className='max-w-6xl mx-auto px-4 py-12'>
        <div
          id='newsletter'
          className='mx-auto max-w-2xl space-y-6'>
          <h3 className='ea-label'>Join eos news</h3>
          <NewsletterForm />
        </div>
      </div>
      <div className='border-t border-[var(--foreground)]/15'>
        <div className='max-w-6xl mx-auto px-4 py-6 flex flex-col-reverse items-center justify-between gap-4 text-sm md:flex-row'>
          <p className='opacity-80'>&copy; {currentYear} eos archive.</p>
          <div className='flex flex-wrap items-center justify-center gap-4 opacity-80 md:justify-start'>
            <a
              href='mailto:hello@eosarchive.app'
              className='hover:underline'>
              hello@eosarchive.app
            </a>
            <a
              href='https://instagram.com/eosarchive.app'
              className='hover:underline'>
              instagram
            </a>
            <Link
              href='/privacy'
              className='hover:underline'>
              privacy
            </Link>
            <Link
              href='/terms'
              className='hover:underline'>
              terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
