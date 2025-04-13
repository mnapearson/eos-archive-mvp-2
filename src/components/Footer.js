// File: src/components/Footer.js
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className='bg-[var(--background)] text-[var(--foreground)] border-t border-[var(--foreground)] mt-20'>
      <div className='max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between'>
        <p className='text-sm'>&copy; {currentYear} eos archive.</p>
        <div className='text-sm flex space-x-4 mt-4 md:mt-0'>
          <Link href='/privacy'>
            <p className='hover:underline'>privacy</p>
          </Link>
          <Link href='/terms'>
            <p className='hover:underline'>terms</p>
          </Link>
          <a
            href='mailto:hello@eosarchive.app'
            className='hover:underline'>
            hello@eosarchive.app
          </a>{' '}
        </div>
      </div>
    </footer>
  );
}
