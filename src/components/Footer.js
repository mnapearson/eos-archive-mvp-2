// File: src/components/Footer.js
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className='bg-[var(--background)] text-[var(--foreground)] border-t border-[var(--foreground)] mt-20'>
      <div className='max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between'>
        <div className='text-sm flex space-x-4 mb-4 md:mt-0'>
          <a href='https://instagram.com/eosarchive.app'>
            <p className='hover:underline'>instagram</p>
          </a>
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
        <div className='text-sm flex space-x-4 mb-4 md:mt-0'>
          <p>&copy; {currentYear} eos archive.</p>
        </div>
      </div>
    </footer>
  );
}
