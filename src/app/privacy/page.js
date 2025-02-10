export default function PrivacyPage() {
  return (
    <div className='flex items-center justify-center min-h-screen px-8 mb-6'>
      <div className='max-w-3xl text-[var(--foreground)]'>
        <h1 className='text-2xl font-semibold mt-6'>privacy & impressum</h1>

        <h2 className='text-lg font-semibold mt-8 mb-2'>impressum</h2>
        <p className='mb-2'>Angaben gemäß § 5 TMG</p>
        <p className='mb-4'>
          <strong>eos archive</strong> <br />
          Michaela Pearson <br />
          Kötzschauerstr. 2 <br />
          04229 Leipzig <br />
          Germany
        </p>

        <h2 className='text-lg font-semibold mt-8 mb-2'>kontakt</h2>
        <p className='mb-2'>Telefon: 01625790189</p>
        <p className='mb-4'>
          E-Mail:{' '}
          <a
            href='mailto:hello@eosarchive.app'
            className='underline'>
            hello@eosarchive.app
          </a>
        </p>

        <h2 className='text-lg font-semibold mt-8 mb-2'>
          verantwortlich für den inhalt nach § 55 abs. 2 rstv
        </h2>
        <p className='mb-4'>
          Michaela Pearson <br />
          Kötzschauerstr. 2 <br />
          04229 Leipzig <br />
          Germany
        </p>

        <h2 className='text-lg font-semibold mt-8 mb-2'>
          haftungsausschluss (disclaimer)
        </h2>
        <h3 className='font-semibold mt-6 mb-1'>haftung für inhalte</h3>
        <p className='mb-4'>
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
          §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
          Nutzung von Informationen nach den allgemeinen Gesetzen bleiben
          hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
          Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
          Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
          Inhalte umgehend entfernen.
        </p>

        <h3 className='font-semibold mt-6 mb-1'>haftung für links</h3>
        <p className='mb-4'>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
          Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
          Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine
          permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne
          konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
          Bekanntwerden von Rechtsverletzungen werden wir derartige Links
          umgehend entfernen.
        </p>

        <h3 className='font-semibold mt-6 mb-1'>urheberrecht</h3>
        <p className='mb-4'>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
          Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
          Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des
          jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
          sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
          wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden
          Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf
          eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
          entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
          werden wir derartige Inhalte umgehend entfernen.
        </p>
      </div>
    </div>
  );
}
