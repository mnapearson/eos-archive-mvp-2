'use client';
import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className='bg-gray-900 text-white px-6 py-4 flex justify-between items-center'>
      <div className='text-xl font-bold'>
        <Link href='/'>eos archive</Link>
      </div>
      <ul className='flex space-x-4'>
        <li>
          <Link href='/map'>Map</Link>
        </li>
        <li>
          <Link href='/submission'>Submit</Link>
        </li>
      </ul>
    </nav>
  );
}
