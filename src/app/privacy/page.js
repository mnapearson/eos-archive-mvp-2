import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className='flex items-center justify-center min-h-screen px-4'>
      <div className='max-w-3xl text-[var(--foreground)]'>
        <h1 className='font-semibold text-2xl mb-6'>Privacy &amp; Impressum</h1>

        <section>
          <h2 className='font-semibold mt-8 mb-2'>Impressum</h2>
          <p className='mb-2'>Information pursuant to § 5 TMG</p>
          <p className='mb-4'>
            <strong>eos archive</strong> <br />
            Michaela Pearson <br />
            Berlin, Germany {/* Update with your actual Berlin address */}
          </p>
        </section>

        <section>
          <h2 className='font-semibold mt-8 mb-2'>Contact</h2>
          <p className='mb-2'>Phone: 01625790189</p>
          <p className='mb-4'>
            Email:{' '}
            <Link
              href='mailto:hello@eosarchive.app'
              className='underline'>
              hello@eosarchive.app
            </Link>
          </p>
        </section>

        <section>
          <h2 className='font-semibold mt-8 mb-2'>Privacy Policy</h2>
          <p className='mb-4'>
            At eos archive we take your privacy seriously. This policy explains
            how we collect, use, and protect your data when you visit our site.
          </p>

          <h3 className='font-semibold mt-6 mb-1'>
            Data Collection &amp; Processing
          </h3>
          <p className='mb-4'>
            We collect only the data necessary to ensure the smooth functioning
            of the archive, such as anonymized analytics data to help us improve
            your experience. No personal data is collected without your consent.
          </p>

          <h3 className='font-semibold mt-6 mb-1'>Cookies &amp; Tracking</h3>
          <p className='mb-4'>
            Our website uses cookies to provide a better user experience and to
            analyze site traffic. You can adjust your cookie settings via your
            browser.
          </p>

          <h3 className='font-semibold mt-6 mb-1'>Third-Party Services</h3>
          <p className='mb-4'>
            We may integrate third-party services (for example, Google
            Analytics) to monitor and analyze traffic. These services may set
            cookies and collect technical information about your visit.
          </p>

          <h3 className='font-semibold mt-6 mb-1'>Security of Your Data</h3>
          <p className='mb-4'>
            We implement appropriate technical and organizational measures to
            protect your data against unauthorized access, disclosure, or
            alteration.
          </p>

          <h3 className='font-semibold mt-6 mb-1'>Your Rights</h3>
          <p className='mb-4'>
            Under applicable data protection laws (including the GDPR), you have
            the right to request access, correction, or deletion of your
            personal data. For any questions or requests, please contact us at{' '}
            <Link
              href='mailto:hello@eosarchive.app'
              className='underline'>
              hello@eosarchive.app
            </Link>
            .
          </p>
        </section>

        {/* New sections added */}
        <section>
          <h2 className='font-semibold mt-8 mb-2'>Account</h2>
          <p className='mb-4'>
            Users don't need to register in order to reach the content of eos
            archive. All content is freely accessible to anyone. However, a free
            account enables users to reorganize the content according to their
            interests. Account holders can curate personal selections of spaces,
            events, artists, authors, exhibitions, venues, cities, books, and
            more—as well as write personal notes and maintain an overview of
            their selections. User pages remain private and can be edited or
            deleted at any time by the user or our team.
          </p>
        </section>

        <section>
          <h2 className='font-semibold mt-8 mb-2'>Content</h2>
          <p className='mb-4'>
            eos archive is built upon a curated selection of spaces and events,
            along with contributions from artists and authors. This selection is
            highly subjective and not intended to be representative of the
            entire art scene. All spaces and events undergo a registration
            process and are approved by our team before publication. We reserve
            the right to administrate, modify, or remove any content or accounts
            as necessary.
          </p>
        </section>

        <section>
          <h2 className='font-semibold mt-8 mb-2'>
            Disclaimer (Haftungsausschluss)
          </h2>

          <h3 className='font-semibold mt-6 mb-1'>Liability for Content</h3>
          <p className='mb-4'>
            As a service provider, we are responsible for our own content on
            these pages in accordance with § 7 Abs.1 TMG. However, we are not
            obligated to monitor transmitted or stored third-party information.
          </p>

          <h3 className='font-semibold mt-6 mb-1'>Liability for Links</h3>
          <p className='mb-4'>
            Our site contains links to external websites of third parties, over
            whose contents we have no influence. Therefore, we cannot be held
            liable for these external contents.
          </p>

          <h3 className='font-semibold mt-6 mb-1'>Copyright</h3>
          <p className='mb-4'>
            The contents and works created by the site operators on these pages
            are subject to the German copyright law. Duplication, processing,
            distribution, or any form of commercialization of such material
            beyond the limits of copyright law requires the written consent of
            the respective author or creator.
          </p>
        </section>
      </div>
    </div>
  );
}
