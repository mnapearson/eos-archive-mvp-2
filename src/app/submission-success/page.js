'use client';

import Link from 'next/link';

export default function SubmissionSuccess() {
  return (
    <div className='max-w-2xl mx-auto p-6 text-justify'>
      <h1 className='text-2xl font-semibold mb-4'>submission received</h1>
      <p className='mb-4'>
        thank you for contributing to eos archive and supporting the subculture
        scene. your event has been submitted and will be reviewed soon.{' '}
      </p>
      <p className='mb-4'>
        once approved, it will become part of the archive, helping to document
        and share the creative spaces, artists, and movements shaping
        independent culture. eos archive exists because of the people who create
        and participate in these events.{' '}
      </p>
      <p className='mb-4'>
        by using the archive, sharing it, and continuing to submit events, you
        help it grow into a stronger resource for the community. if you know
        others organizing events, let them know they can submit as well.
      </p>
      <p>from dusk til dawn,</p>
      <p className='mb-4'>eos</p>
      <p>
        ps. need help with your submission? get in touch:{' '}
        <a
          href='mailto:hello@eosarchive.app'
          className='hover:underline'>
          hello@eosarchive.app.
        </a>
      </p>

      {/* Navigation Buttons */}
      <div className='mt-10 flex flex-col gap-4'>
        <Link
          href='/'
          className='hover:underline'>
          return to archive
        </Link>
        <Link
          href='/submission'
          className='hover:underline'>
          submit another event
        </Link>
      </div>
    </div>
  );
}
