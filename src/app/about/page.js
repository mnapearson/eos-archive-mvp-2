export default function AboutPage() {
  return (
    <div className='flex justify-center min-h-screen px-8'>
      <div className='max-w-3xl text-[var(--foreground)]'>
        <h1 className='text-2xl font-semibold mb-6'>about eos</h1>
        <p className='mb-4'>
          eos archive elevates event art—flyers, posters, and other visuals—from
          ephemeral cultural artifacts to essential citations in the
          (post)digital age. as a platform documenting subcultural creativity,
          eos archive reimagines knowledge sharing by treating each piece of
          event art as a reference point for understanding connections between
          artists, collectives, and spaces.
        </p>

        <p className='mb-4'>
          subcultural events not only reflect the creative pulse of their time
          but actively shape their scenes, capturing trends in expression, color
          waves, and aesthetic forms. these events document the movements of the
          moment, offering invaluable insight into underground and alternative
          culture. by preserving and curating these artifacts, eos archive
          creates a resource that future generations can use to trace the
          histories of subcultural creativity in cities across the globe,
          fostering inspiration and understanding of the diverse trajectories of
          the creative underground.
        </p>

        <p className='mb-4'>
          built with open-source principles, eos archive offers direct public
          access for uploading and browsing, alongside an api to extend the
          archive's utility across platforms. this approach ensures
          transparency, inclusivity, and adaptability for a diverse range of
          users.
        </p>

        <p className='mb-4'>
          curious about eos archive and want to get involved? email us at any
          time:{' '}
          <a
            href='mailto:hello@eosarchive.app'
            className='hover:underline'>
            hello@eosarchive.app.
          </a>
        </p>

        <p>
          from dusk til dawn, <br /> eos
        </p>
      </div>
    </div>
  );
}
