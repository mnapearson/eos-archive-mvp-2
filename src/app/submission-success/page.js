'use client';

import Link from 'next/link';

export default function SubmissionSuccess() {
  return (
    <div className='max-w-2xl mx-auto text-justify'>
      <div className='mb-4'>
        <Link
          href='/spaces/admin'
          className='text-sm hover:text-gray-600'>
          ← return to dashboard
        </Link>
      </div>
      <h1 className='font-semibold mb-4'>submission received</h1>
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
        <Link
          href='mailto:hello@eosarchive.app'
          className='underline hover:text-gray-600'>
          hello@eosarchive.app.
        </Link>
      </p>
    </div>
  );
}
