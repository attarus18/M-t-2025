import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy | Meteo Zoo',
};

export default function PrivacyPage() {
  return (
    <div className="glass space-y-6 rounded-3xl p-5 text-sm leading-relaxed">
      <Link href="/impostazioni/" className="-ml-1 inline-flex items-center font-semibold opacity-80">
        <ChevronLeft className="h-4 w-4" /> Altro
      </Link>
      <div>
        <h1 className="font-fun text-2xl font-bold">Informativa sulla privacy di Meteo Zoo</h1>
        <p className="mt-1 opacity-80">Ultimo aggiornamento: 30 settembre 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Titolare del trattamento</h2>
        <p>
          Centro Servizi Telematici Srl, sviluppatore dell&apos;app Meteo Zoo. Per domande su questa informativa
          puoi scrivere a <span className="font-semibold">attarus18@gmail.com</span>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Nessun account, dati sul tuo dispositivo</h2>
        <p>
          Meteo Zoo non richiede registrazione. Città salvate e animale scelto vengono salvati solo sul tuo
          dispositivo e non vengono mai inviati ai nostri server. Disinstallando l&apos;app o cancellandone i dati
          vengono eliminati.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Posizione e dati meteo (OpenWeatherMap)</h2>
        <p>
          Se lo consenti, l&apos;app usa la posizione approssimativa del dispositivo solo per mostrarti il meteo del
          luogo in cui ti trovi. Le coordinate e i nomi delle città che cerchi vengono inviati direttamente dal tuo
          dispositivo a OpenWeatherMap Ltd (Regno Unito), che fornisce i dati meteo, senza passare dai nostri server e
          senza essere associati a te. Non conserviamo la tua posizione. Puoi negare o revocare il permesso dalle
          impostazioni di Android e usare comunque l&apos;app cercando le città a mano. Informativa di OpenWeatherMap:{' '}
          <span className="font-semibold">openweather.co.uk/privacy-policy</span>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Pubblicità (Google AdMob)</h2>
        <p>
          Nella versione gratuita l&apos;app mostra annunci forniti da Google AdMob (Google Ireland Limited). Per
          mostrare, misurare e proteggere gli annunci, l&apos;SDK di Google integrato nell&apos;app raccoglie e
          condivide con Google i seguenti dati:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>ID dispositivo o altri ID</strong>: l&apos;identificativo pubblicitario di Android;</li>
          <li><strong>Posizione approssimativa</strong>: ricavata dall&apos;indirizzo IP, mai la posizione esatta (GPS);</li>
          <li><strong>Interazioni con l&apos;app</strong>: ad esempio visualizzazioni e tocchi sugli annunci;</li>
          <li><strong>Log degli arresti anomali e dati diagnostici</strong>: informazioni tecniche sul funzionamento degli annunci.</li>
        </ul>
        <p>
          Questi dati sono usati per pubblicità, statistiche e prevenzione delle frodi, vengono trasmessi in modo
          criptato e possono essere trattati da Google anche fuori dall&apos;Unione Europea, con le garanzie previste
          dal GDPR. Nell&apos;Unione Europea, nel Regno Unito e in Svizzera, al primo avvio ti viene chiesto il consenso
          agli annunci personalizzati; se non lo dai vedrai solo annunci non personalizzati. Puoi cambiare scelta in
          qualsiasi momento da Altro &gt; Preferenze privacy annunci. Con qualsiasi acquisto gli annunci vengono disattivati.
          Maggiori informazioni: <span className="font-semibold">policies.google.com/technologies/ads</span>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Base giuridica e conservazione</h2>
        <p>
          Gli annunci personalizzati si basano sul tuo consenso; l&apos;uso della posizione sul permesso che concedi
          ad Android; gli annunci non personalizzati, le statistiche e la prevenzione delle frodi sul legittimo
          interesse a mantenere gratuita e sicura l&apos;app. Noi non conserviamo alcun dato personale: i dati
          pubblicitari sono conservati da Google secondo la propria informativa
          (<span className="font-semibold">policies.google.com/privacy</span>).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Acquisti (Google Play)</h2>
        <p>
          Il pagamento dei pacchetti di animali è gestito interamente da Google Play: non vediamo né conserviamo i
          dati della tua carta. Per sapere quali pacchetti hai l&apos;app chiede a Google Play, direttamente dal tuo
          dispositivo, quali acquisti risultano attivi sul tuo account: nessun dato sugli acquisti viene inviato ai
          nostri server o a terzi.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">I tuoi diritti</h2>
        <p>
          In base al GDPR puoi chiedere accesso, rettifica, cancellazione, limitazione od opposizione al trattamento
          scrivendo all&apos;indirizzo del titolare, e revocare in qualsiasi momento il consenso agli annunci
          personalizzati dall&apos;app. Puoi anche reimpostare o eliminare l&apos;identificativo pubblicitario dalle
          impostazioni di Android (Google &gt; Annunci). Hai inoltre il diritto di presentare reclamo al Garante per la
          protezione dei dati personali (<span className="font-semibold">garanteprivacy.it</span>).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Minori</h2>
        <p>
          Meteo Zoo non è destinata a minori di 13 anni e non raccogliamo consapevolmente dati di minori.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Modifiche</h2>
        <p>Eventuali modifiche sostanziali a questa informativa verranno comunicate all&apos;interno dell&apos;app.</p>
      </section>
    </div>
  );
}
