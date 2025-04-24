'use client';

import Link from 'next/link';

export default function SubmissionSuccess() {
  return (
    <div className='max-w-2xl mx-auto text-justify'>
      <div className='mb-4'>
        <Link
          href='/spaces/admin'
          className='text-sm hover:text-gray-600'
          scroll={false}>
          ← return to dashboard
        </Link>
      </div>
      <h1 className='font-semibold mb-4'>submission received</h1>
      <p className='mb-4'>
        thank you for contributing to eos archive and supporting the subculture
        scene. your event has been automatically approved and is now live across
        the archive: you can view it on the homepage, on your space page, and
        the <strong>Archive</strong> tab in your dashboard.
      </p>
      <p className='mb-4'>
        if you need to make any edits or corrections, please get in touch with
        us at{' '}
        <a
          href='mailto:hello@eosarchive.app'
          className='underline hover:text-gray-600'>
          hello@eosarchive.app
        </a>
        . we’re here to help ensure your event is accurately represented.
      </p>
      <p className='mb-4 italic'>
        according to our terms and conditions, we reserve the right to remove
        any event after it has been approved.
      </p>
      <p className='mb-4'>
        by using the archive, sharing it, and continuing to submit events, you
        help it grow into a stronger resource for the community. if you know
        others organizing events, let them know they can submit as well.
      </p>
      <p>from dusk til dawn,</p>
      <p className='mb-4'>eos</p>
      <p>
        ps. have other feedback or questions? get in touch:{' '}
        <a
          href='mailto:hello@eosarchive.app'
          className='underline hover:text-gray-600'>
          hello@eosarchive.app.
        </a>
      </p>
    </div>
  );
}
