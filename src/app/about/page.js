export default function AboutPage() {
  return (
    <div className='mx-auto w-full max-w-[92vw] lg:max-w-5xl xl:max-w-6xl py-8 space-y-12'>
      <header className='space-y-4'>
        <span className='ea-label ea-label--muted'>About eos archive</span>
        <h1 className='quick-view__title text-balance'>
          Culture 'til dawn - a living archive of event graphics.
        </h1>
        <p className='max-w-2xl text-sm sm:text-base leading-relaxed text-[var(--foreground)]/70'>
          eos preserves the visual language of independent culture. Flyers,
          posters, and announcements that once existed for a single night become
          collective memory—documenting who gathered, where it happened, and the
          energy that held it all together.
        </p>
      </header>

      <div className='grid gap-6 md:grid-cols-2'>
        <article className='rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/80 p-6 sm:p-8 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)]'>
          <span className='ea-label'>What we collect</span>
          <p className='text-sm sm:text-base leading-relaxed text-[var(--foreground)]/85'>
            Each contribution is curated from the independent scene—events,
            exhibitions, and parties that give cities their pulse. Graphics are
            catalogued with their designers, spaces, and contextual metadata so
            temporary promotion becomes lasting cultural infrastructure.
          </p>
        </article>

        <article className='rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/80 p-6 sm:p-8 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)]'>
          <span className='ea-label'>How to explore</span>
          <p className='text-sm sm:text-base leading-relaxed text-[var(--foreground)]/85'>
            Browse by city, category, or time period. Jump into spaces to see
            how they evolve, or use the map to trace where communities gather.
            The archive pairs visual storytelling with data so you can follow
            movements across designers, collectives, and venues.
          </p>
        </article>

        <article className='rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/80 p-6 sm:p-8 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)]'>
          <span className='ea-label'>Why it matters</span>
          <p className='text-sm sm:text-base leading-relaxed text-[var(--foreground)]/85'>
            Independent scenes are constantly shifting. By preserving their
            ephemera, eos builds a reference for the future—showing how
            subcultures adapt, who supported them, and which aesthetics defined
            the moment. It’s a way to learn from what came before while creating
            space for what’s next.
          </p>
        </article>

        <article className='rounded-3xl border border-[var(--foreground)]/12 bg-[var(--background)]/80 p-6 sm:p-8 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)]'>
          <span className='ea-label'>Get in touch</span>
          <p className='text-sm sm:text-base leading-relaxed text-[var(--foreground)]/85'>
            We’re always collecting new ideas, spaces, and collaborations. Share
            feedback, send flyers, or simply say hello at{' '}
            <a
              href='mailto:hello@eosarchive.app'
              className='underline hover:no-underline'>
              hello@eosarchive.app
            </a>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
