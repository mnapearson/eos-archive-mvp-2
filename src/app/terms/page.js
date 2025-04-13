// src/app/terms/page.js
export default function TermsPage() {
  return (
    <div>
      <div className='mx-auto'>
        <h1 className='text-lg font-bold mb-4'>Terms and Conditions</h1>
        <p className='text-sm text-gray-600 mb-8'>Last updated: April 2025</p>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>Acceptance of Terms</h2>
          <p>
            By accessing and using eos archive and by submitting Events, you
            agree to these Terms. If you do not agree with any part of these
            Terms, please do not use our platform or submit any Events.
          </p>
        </section>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>Event Submission Guidelines</h2>
          <ul className='list-disc pl-5 space-y-2'>
            <li>
              <strong>Eligibility:</strong> You must be at least 18 years old
              (or have parental or legal guardian consent) to submit any Events.
            </li>
            <li>
              <strong>Originality and Rights:</strong> You must be the owner of
              the Event Art or have obtained permission from the owner. By
              submitting Events, you represent and warrant that you have the
              rights to share and license the content.
            </li>
            <li>
              <strong>Accuracy:</strong> All information provided in your
              submission (including event details, image files, and metadata)
              must be accurate and complete.
            </li>
            <li>
              <strong>Content Restrictions:</strong> Event Art must reflect
              authentic events. Submissions that contain content that is
              defamatory, pornographic, abusive, or that infringe on any
              intellectual property or privacy rights are strictly prohibited
              and may be rejected or removed.
            </li>
          </ul>
        </section>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>
            License Grant and Intellectual Property
          </h2>
          <ul className='list-disc pl-5 space-y-2'>
            <li>
              <strong>Your Ownership:</strong> All Event Art you submit remains
              your property.
            </li>
            <li>
              <strong>License to Use:</strong> By submitting Events, you grant
              eos archive a non-exclusive, worldwide, royalty-free, perpetual,
              irrevocable license to use, reproduce, display, modify,
              distribute, and create derivative works of your Event Art (in
              whole or in part) for the purposes of the platform, including
              third-party integrations, promotional materials, and analytics.
            </li>
            <li>
              <strong>Copyright Assurance:</strong> You represent that your
              submission does not infringe the copyrights or other intellectual
              property rights of any third party.
            </li>
          </ul>
        </section>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>Review and Approval</h2>
          <ul className='list-disc pl-5 space-y-2'>
            <li>
              <strong>Administrative Review:</strong> All Event submissions are
              subject to review. eos archive reserves the right to approve or
              reject any submission at its sole discretion.
            </li>
            <li>
              <strong>Removal of Content:</strong> We may remove any submitted
              content that we determine, in our sole judgment, violates these
              Terms or is otherwise inappropriate for publication.
            </li>
          </ul>
        </section>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>Disclaimer of Warranties</h2>
          <p>
            eos archive is provided on an "AS IS" and "AS AVAILABLE" basis. We
            make no warranties—express or implied—regarding the platform or any
            Events submitted by users. You assume full responsibility for any
            reliance on the content available through eos archive.
          </p>
        </section>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>Limitation of Liability</h2>
          <p>
            In no event shall eos archive be liable for any direct, indirect,
            incidental, consequential, or punitive damages arising from your use
            of the platform or your submission of Events.
          </p>
        </section>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the jurisdiction in which eos archive operates. Any
            disputes arising out of or relating to these Terms shall be resolved
            through binding arbitration or in the appropriate courts of that
            jurisdiction.
          </p>
        </section>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>Changes to These Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. The most
            current version will be posted on our platform, and your continued
            use of eos archive constitutes acceptance of any changes to the
            Terms.
          </p>
        </section>

        <section className='mb-6'>
          <h2 className='text-lg mb-2'>Contact Information</h2>
          <p>
            If you have any questions, concerns, or disputes regarding these
            Terms, please contact us at{' '}
            <a
              href='mailto:hello@eosarchive.app'
              className='hover:underline'>
              hello@eosarchive.app
            </a>
            .
          </p>
        </section>

        <p className='mt-8'>
          By submitting your Event to eos archive, you acknowledge that you have
          read, understood, and agree to these Terms and Conditions.
        </p>
      </div>
    </div>
  );
}
