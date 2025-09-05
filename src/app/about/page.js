export default function AboutPage() {
  return (
    <div className='mx-auto w-3/4'>
      <p className='mb-4'>
        eos is a living archive of event culture: graphics and spaces from the
        independent scene. What was once temporary promotion becomes lasting
        cultural memory.
      </p>

      <p className='mb-4'>
        Each piece is more than an image: it connects artists, collectives, and
        the spaces where culture happens. On the platform, you can explore the
        map of spaces, browse by city, and discover events through the visuals
        that document them.
      </p>

      <p className='mb-4'>
        Together these artefacts tell the story of subcultures in motion...
        shifting colors, styles, and ideas that shape how we gather and create.
        By preserving and curating this material, eos builds a resource for both
        today and the future. A way to see how independent culture grows, and to
        keep these histories alive.
      </p>

      <p className='mb-4'>
        You can email us at any time, we would love to hear your feedback or
        ideas for features—{' '}
        <a
          href='mailto:hello@eosarchive.app'
          className='hover:underline'>
          hello@eosarchive.app
        </a>
        .
      </p>
      <p>
        til dawn, <br /> eos
      </p>
    </div>
  );
}
