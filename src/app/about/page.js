export default function AboutPage() {
  return (
    <main className='px-4 py-6 sm:px-6 lg:px-8'>
      <header className='mb-6 sm:mb-8'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-[11px] tracking-wide uppercase opacity-60'>
            About eos archive
          </div>
        </div>
      </header>
      <div className='max-w-3xl mx-auto text-sm'>
        <p className='mb-4'>
          eos is a living archive of event culture: curated graphics from the
          independent scene. What was once temporary promotion becomes lasting
          cultural memory.
        </p>

        <p className='mb-4'>
          Each graphic is more than an image: it's an invitation to connect to
          the artists, collectives, and spaces where culture happens. On the
          platform, you can explore a map of spaces, browse by city, and
          discover events through the visuals that document them.
        </p>

        <p className='mb-4'>
          Together these artefacts tell the story of subcultures in motion...
          shifting colors, styles, and ideas that shape how we gather and
          create. By preserving and curating this material, eos builds a
          resource for both today and the future. A way to see how independent
          culture grows, and to keep these histories alive.
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
    </main>
  );
}
