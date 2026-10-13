"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/i18n";

/** Informativa in italiano per chi usa l'app in italiano, in inglese per tutte le altre lingue. */
export function PrivacyContent() {
  const { t, locale } = useI18n();
  return locale === "it" ? (
    <PrivacyIt back={t.nav.more} />
  ) : (
    <PrivacyEn back={t.nav.more} />
  );
}

function PrivacyIt({ back }: { back: string }) {
  return (
    <div className="glass space-y-6 rounded-3xl p-5 text-sm leading-relaxed">
      <Link
        href="/impostazioni/"
        className="-ml-1 inline-flex items-center font-semibold opacity-80"
      >
        <ChevronLeft className="h-4 w-4" /> {back}
      </Link>
      <div>
        <h1 className="font-fun text-2xl font-bold">
          Informativa sulla privacy di Meteo Zoo
        </h1>
        <p className="mt-1 opacity-80">
          Ultimo aggiornamento: 30 settembre 2026
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Titolare del trattamento</h2>
        <p>
          Centro Servizi Telematici Srl, sviluppatore dell&apos;app Meteo Zoo.
          Per domande su questa informativa puoi scrivere a{" "}
          <span className="font-semibold">attarus18@gmail.com</span>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Nessun account, dati sul tuo dispositivo
        </h2>
        <p>
          Meteo Zoo non richiede registrazione. Città salvate e animale scelto
          vengono salvati solo sul tuo dispositivo e non vengono mai inviati ai
          nostri server. Disinstallando l&apos;app o cancellandone i dati
          vengono eliminati.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Posizione e dati meteo (OpenWeatherMap)
        </h2>
        <p>
          Se lo consenti, l&apos;app usa la posizione approssimativa del
          dispositivo solo per mostrarti il meteo del luogo in cui ti trovi. Le
          coordinate (arrotondate a circa 1 km) e i nomi delle città che cerchi
          passano dal nostro servizio su Vercel Inc. (meteo-zoo.vercel.app), che
          le inoltra a OpenWeatherMap Ltd (Regno Unito) per ottenere i dati
          meteo, senza associarle a te e senza conservarle. L&apos;ultima
          posizione rilevata resta solo sul tuo dispositivo. Puoi negare o
          revocare il permesso dalle impostazioni di Android e usare comunque
          l&apos;app cercando le città a mano. Informativa di OpenWeatherMap:{" "}
          <span className="font-semibold">
            openweather.co.uk/privacy-policy
          </span>
          .
        </p>
        <p>
          Se attivi la notifica &quot;Meteo del giorno&quot;, l&apos;app prepara
          sul dispositivo le notifiche dei prossimi giorni usando l&apos;ultima
          posizione rilevata. Non usiamo servizi di notifica push e non
          riceviamo dati su di te. Puoi disattivarla in Altro &gt; Notifiche o
          dalle impostazioni di Android.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Pubblicità (Google AdMob)</h2>
        <p>
          Nella versione gratuita l&apos;app mostra annunci forniti da Google
          AdMob (Google Ireland Limited). Per mostrare, misurare e proteggere
          gli annunci, l&apos;SDK di Google integrato nell&apos;app raccoglie e
          condivide con Google i seguenti dati:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>ID dispositivo o altri ID</strong>: l&apos;identificativo
            pubblicitario di Android;
          </li>
          <li>
            <strong>Posizione approssimativa</strong>: ricavata
            dall&apos;indirizzo IP, mai la posizione esatta (GPS);
          </li>
          <li>
            <strong>Interazioni con l&apos;app</strong>: ad esempio
            visualizzazioni e tocchi sugli annunci;
          </li>
          <li>
            <strong>Log degli arresti anomali e dati diagnostici</strong>:
            informazioni tecniche sul funzionamento degli annunci.
          </li>
        </ul>
        <p>
          Questi dati sono usati per pubblicità, statistiche e prevenzione delle
          frodi, vengono trasmessi in modo criptato e possono essere trattati da
          Google anche fuori dall&apos;Unione Europea, con le garanzie previste
          dal GDPR. Nell&apos;Unione Europea, nel Regno Unito e in Svizzera, al
          primo avvio ti viene chiesto il consenso agli annunci personalizzati;
          se non lo dai vedrai solo annunci non personalizzati. Puoi cambiare
          scelta in qualsiasi momento da Altro &gt; Preferenze privacy annunci.
          Con qualsiasi acquisto gli annunci vengono disattivati. Maggiori
          informazioni:{" "}
          <span className="font-semibold">
            policies.google.com/technologies/ads
          </span>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Base giuridica e conservazione
        </h2>
        <p>
          Gli annunci personalizzati si basano sul tuo consenso; l&apos;uso
          della posizione sul permesso che concedi ad Android; gli annunci non
          personalizzati, le statistiche e la prevenzione delle frodi sul
          legittimo interesse a mantenere gratuita e sicura l&apos;app. Noi non
          conserviamo alcun dato personale: i dati pubblicitari sono conservati
          da Google secondo la propria informativa (
          <span className="font-semibold">policies.google.com/privacy</span>).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Acquisti (Google Play)</h2>
        <p>
          Il pagamento dei pacchetti di animali è gestito interamente da Google
          Play: non vediamo né conserviamo i dati della tua carta. Per sapere
          quali pacchetti hai l&apos;app chiede a Google Play, direttamente dal
          tuo dispositivo, quali acquisti risultano attivi sul tuo account:
          nessun dato sugli acquisti viene inviato ai nostri server o a terzi.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">I tuoi diritti</h2>
        <p>
          In base al GDPR puoi chiedere accesso, rettifica, cancellazione,
          limitazione od opposizione al trattamento scrivendo all&apos;indirizzo
          del titolare, e revocare in qualsiasi momento il consenso agli annunci
          personalizzati dall&apos;app. Puoi anche reimpostare o eliminare
          l&apos;identificativo pubblicitario dalle impostazioni di Android
          (Google &gt; Annunci). Hai inoltre il diritto di presentare reclamo al
          Garante per la protezione dei dati personali (
          <span className="font-semibold">garanteprivacy.it</span>).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Minori</h2>
        <p>
          Meteo Zoo non è destinata a minori di 13 anni e non raccogliamo
          consapevolmente dati di minori.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Modifiche</h2>
        <p>
          Eventuali modifiche sostanziali a questa informativa verranno
          comunicate all&apos;interno dell&apos;app.
        </p>
      </section>
    </div>
  );
}

function PrivacyEn({ back }: { back: string }) {
  return (
    <div className="glass space-y-6 rounded-3xl p-5 text-sm leading-relaxed">
      <Link
        href="/impostazioni/"
        className="-ml-1 inline-flex items-center font-semibold opacity-80"
      >
        <ChevronLeft className="h-4 w-4" /> {back}
      </Link>
      <div>
        <h1 className="font-fun text-2xl font-bold">
          Meteo Zoo Privacy Policy
        </h1>
        <p className="mt-1 opacity-80">Last updated: October 13, 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Data controller</h2>
        <p>
          Centro Servizi Telematici Srl (Italy), developer of the Meteo Zoo app.
          For questions about this policy you can write to{" "}
          <span className="font-semibold">attarus18@gmail.com</span>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          No account, data stays on your device
        </h2>
        <p>
          Meteo Zoo does not require registration. Saved cities, the chosen
          animal, language and units are stored only on your device and are
          never sent to our servers. They are deleted when you uninstall the app
          or clear its data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Location and weather data (OpenWeatherMap)
        </h2>
        <p>
          If you allow it, the app uses your device&apos;s approximate location
          only to show you the weather where you are. The coordinates (rounded
          to about 1 km) and the names of the cities you search for go through
          our service on Vercel Inc. (meteo-zoo.vercel.app), which forwards them
          to OpenWeatherMap Ltd (United Kingdom) to get the weather data,
          without linking them to you and without storing them. The last
          detected location stays only on your device. You can deny or revoke
          the permission in Android settings and still use the app by searching
          for cities manually. OpenWeatherMap privacy policy:{" "}
          <span className="font-semibold">
            openweather.co.uk/privacy-policy
          </span>
          .
        </p>
        <p>
          If you turn on the &quot;Daily weather&quot; notification, the app
          prepares the notifications for the next days on your device using the
          last detected location. We do not use push notification services and
          we do not receive any data about you. You can turn it off in More &gt;
          Notifications or in Android settings.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Advertising (Google AdMob)</h2>
        <p>
          In the free version the app shows ads provided by Google AdMob (Google
          Ireland Limited). To show, measure and protect ads, the Google SDK
          built into the app collects and shares the following data with Google:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Device or other IDs</strong>: the Android advertising ID;
          </li>
          <li>
            <strong>Approximate location</strong>: derived from the IP address,
            never the precise (GPS) location;
          </li>
          <li>
            <strong>App interactions</strong>: for example ad views and taps;
          </li>
          <li>
            <strong>Crash logs and diagnostics</strong>: technical information
            about how ads work.
          </li>
        </ul>
        <p>
          This data is used for advertising, analytics and fraud prevention, is
          encrypted in transit and may be processed by Google outside the
          European Union with the safeguards required by the GDPR. In the
          European Union, the United Kingdom and Switzerland you are asked for
          consent to personalized ads on first launch; if you don&apos;t give it
          you will only see non-personalized ads. You can change your choice at
          any time in More &gt; Ad privacy preferences. Any purchase turns ads
          off. More information:{" "}
          <span className="font-semibold">
            policies.google.com/technologies/ads
          </span>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Legal basis and retention</h2>
        <p>
          Personalized ads are based on your consent; the use of location on the
          permission you grant to Android; non-personalized ads, analytics and
          fraud prevention on our legitimate interest in keeping the app free
          and secure. We do not store any personal data: advertising data is
          stored by Google according to its own policy (
          <span className="font-semibold">policies.google.com/privacy</span>).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Purchases (Google Play)</h2>
        <p>
          Payment for animal packs is handled entirely by Google Play: we never
          see or store your card details. To know which packs you own, the app
          asks Google Play, directly from your device, which purchases are
          active on your account: no purchase data is sent to our servers or to
          third parties.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your rights</h2>
        <p>
          Under the GDPR and similar laws you can request access, correction,
          deletion, restriction of or objection to processing by writing to the
          controller&apos;s address, and withdraw your consent to personalized
          ads at any time from the app. You can also reset or delete the
          advertising ID in Android settings (Google &gt; Ads). You also have
          the right to lodge a complaint with your local data protection
          authority (in Italy, the Garante per la protezione dei dati personali,{" "}
          <span className="font-semibold">garanteprivacy.it</span>).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Children</h2>
        <p>
          Meteo Zoo is not directed at children under 13 and we do not knowingly
          collect data from children.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Changes</h2>
        <p>
          Any significant changes to this policy will be announced inside the
          app.
        </p>
      </section>
    </div>
  );
}
