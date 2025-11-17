import SupportForm from '@/components/SupportForm';

export const metadata = {
  title: 'Support eos archive',
  description:
    'Fuel the living archive with a direct contribution without leaving eos.',
};

export default function SupportPage() {
  return (
    <div className='mx-auto w-full max-w-[92vw] lg:max-w-5xl xl:max-w-6xl py-10 space-y-12'>
      <header className='space-y-4 max-w-3xl'>
        <span className='ea-label ea-label--muted'>Support eos archive</span>
        <h1 className='quick-view__title text-balance'>
          Help keep this platform independent and community-owned.
        </h1>
        <p className='text-sm sm:text-base leading-relaxed text-[var(--foreground)]/70'>
          Your contribution goes directly to building the digital commons —
          hosting, development, and time spent archiving event culture. All
          payments are processed through Stripe. You’ll receive a receipt
          instantly.
        </p>
      </header>

      <div className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]'>
        <SupportForm />

        <aside className='space-y-6'>
          <article className='rounded-3xl border border-[var(--foreground)]/10 bg-[var(--background)]/60 p-6 space-y-4'>
            <span className='ea-label'>Need help?</span>
            <p className='text-sm text-[var(--foreground)]/75'>
              Send funding questions, invoices, or partnership ideas to{' '}
              <a
                href='mailto:hello@eosarchive.app'
                className='underline hover:no-underline'>
                hello@eosarchive.app
              </a>
              . We can issue receipts for companies, collectives, or DAOs.
            </p>
          </article>

          <article className='rounded-3xl border border-[var(--foreground)]/10 bg-[var(--background)]/50 p-6 space-y-3'>
            <span className='ea-label'>Other ways to support</span>
            <p className='text-sm text-[var(--foreground)]/70'>
              Share this app, register a space, submit new events. Every
              contribution—financial or archival—keeps the culture accessible.
            </p>
          </article>
        </aside>
      </div>
    </div>
  );
}
