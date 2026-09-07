'use client';

import { useState } from 'react';
import s from './KontaktFormular.module.css';

const ENDPOINT = 'https://kontakt.erlandsson.online/';

/**
 * Kontaktformuläret. Postar till en delad Cloudflare Worker som mejlar vidare.
 *
 * `slug` avgör både mejladressen som visas och vilken app som står i
 * ämnesraden hos mottagaren, så den ska vara appens riktiga slug — samma som
 * i appens publika adress — och inte katalognamnet.
 *
 * Fältnamnen är ett kontrakt mot Workern och får inte döpas om. Detsamma
 * gäller värdena i ämnesvalet; bara etiketterna är fria.
 */
export function KontaktFormular({ slug }: { slug: string }) {
  const adress = `${slug}@erlandsson.online`;
  const [status, setStatus] = useState('');
  const [lage, setLage] = useState<'fel' | 'klart' | ''>('');
  const [skickar, setSkickar] = useState(false);

  async function skicka(handelse: React.FormEvent<HTMLFormElement>) {
    handelse.preventDefault();
    const form = handelse.currentTarget;
    const data = new FormData(form);

    if ((data.get('meddelande') as string).trim().length < 3) {
      setStatus('Skriv några ord om vad som är fel.');
      setLage('fel');
      return;
    }

    setSkickar(true);
    setStatus('Skickar …');
    setLage('');

    const kropp = new URLSearchParams(data as unknown as Record<string, string>);
    kropp.set('app', slug);
    kropp.set('sida', location.href);

    try {
      const svar = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: kropp,
      });
      const resultat = await svar.json();
      if (!resultat.ok) throw new Error(resultat.fel || 'Något gick fel.');
      form.reset();
      setStatus('Tack! Meddelandet är skickat.');
      setLage('klart');
    } catch (fel) {
      const text = fel instanceof Error ? fel.message : 'Något gick fel.';
      setStatus(`${text} Du kan också mejla ${adress} direkt.`);
      setLage('fel');
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className={s.sida}>
      <h1 className={s.rubrik}>Kontakt</h1>
      <p className={s.ingress}>
        Samarbeten, förbättringsförslag, en siffra som ser fel ut eller något
        helt annat – hör av dig. Allt landar direkt hos mig: ingen
        supportportal, inget ärendenummer.
      </p>

      <a className={s.mejl} href={`mailto:${adress}`}>
        <svg
          className={s.mejlIkon}
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="16" rx="2.5" />
          <path d="m2.5 6.5 9.5 6.5 9.5-6.5" />
        </svg>
        <span>
          <b>Mejla direkt</b>
          <span className={s.mejlAdress}>{adress}</span>
        </span>
      </a>

      <p className={s.avdelare}>eller skriv här</p>

      <form onSubmit={skicka} noValidate>
        <label className={s.falt} htmlFor="kf-amne">
          Vad gäller det?
        </label>
        <select className={s.val} id="kf-amne" name="amne" defaultValue="felrapport">
          <option value="felrapport">Något är fel</option>
          <option value="forslag">Förbättringsförslag</option>
          <option value="samarbete">Samarbete</option>
          <option value="fraga">Fråga</option>
          <option value="annat">Annat</option>
        </select>

        <label className={s.falt} htmlFor="kf-meddelande">
          Ditt meddelande
          <span className={s.hjalp}>
            Gäller det ett fel: beskriv gärna vad du gjorde och vad du förväntade dig.
          </span>
        </label>
        <textarea
          className={s.textruta}
          id="kf-meddelande"
          name="meddelande"
          maxLength={5000}
          required
        />

        <label className={s.falt} htmlFor="kf-epost">
          Din e-postadress
          <span className={s.hjalp}>Frivillig. Används bara för att svara dig.</span>
        </label>
        <input
          className={s.rad}
          id="kf-epost"
          name="epost"
          type="email"
          autoComplete="email"
          maxLength={200}
        />

        <div className={s.falla} aria-hidden="true">
          <label htmlFor="kf-webbplats">Lämna det här fältet tomt</label>
          <input id="kf-webbplats" name="webbplats" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <button className={s.knapp} type="submit" disabled={skickar}>
          Skicka
        </button>
        <p className={s.status} role="status" aria-live="polite" data-lage={lage || undefined}>
          {status}
        </p>
      </form>

      <footer className={s.fot}>
        <a href="https://erlandsson.online/" rel="noopener">
          <span className={s.bricka}>
            {/* Loggan serveras från Workern, så en ny logga är en deploy och
                inte en binärkopia i vart och ett av apprepona. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://kontakt.erlandsson.online/erlandsson.png"
              alt=""
              aria-hidden="true"
              width={145}
              height={72}
              loading="lazy"
            />
          </span>
          <span>
            <b>En del av erlandsson.online</b>
            <small>Byggt och drivet av Robert Erlandsson</small>
          </span>
        </a>
        <a href="https://everydayapps.se/" rel="noopener">
          <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden="true">
            <defs>
              <linearGradient id="kf-eda" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b6dff" />
                <stop offset="100%" stopColor="#5b34f0" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="11" fill="url(#kf-eda)" />
            <path d="M20 9.5 30 15l-10 5.5L10 15z" fill="#fff" />
            <path
              d="M10 20.2 20 25.7l10-5.5"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity=".78"
            />
          </svg>
          <span>
            <b>EveryDayApps</b>
            <small>Del av appsamlingen</small>
          </span>
        </a>
      </footer>
    </div>
  );
}
