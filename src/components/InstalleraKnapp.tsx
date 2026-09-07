"use client";

/**
 * Erbjuder installation i appens eget gränssnitt.
 *
 * Manifestet ensamt ger webbläsarens egen prompt, men den ligger begravd i en
 * meny nästan ingen öppnar. Knappen renderas bara när installationen faktiskt
 * är möjlig — därför behövs varken avvisningsknapp eller localStorage-nyckel.
 *
 * Den bor i AppShell och inte på /installningar: appen saknar sidfot, och
 * skalet är det enda som finns på startsidan.
 */

import { useEffect, useState, useSyncExternalStore } from "react";

/** Chromiums installationshändelse saknas i lib.dom. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const arInstallerad = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * iOS-hinten avgörs på klienten. `useSyncExternalStore` i stället för en
 * effekt som sätter state: setState synkront i en effekt är ett lint-fel, och
 * serversnapshoten `false` ger ändå en dold första rendering.
 */
const ingenPrenumeration = () => () => {};
const iosSnapshot = () =>
  !arInstallerad() && /iPad|iPhone|iPod/.test(navigator.userAgent);
const serverSnapshot = () => false;

export function InstalleraKnapp() {
  const ios = useSyncExternalStore(
    ingenPrenumeration,
    iosSnapshot,
    serverSnapshot,
  );
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (arInstallerad()) return;

    const fanga = (handelse: Event) => {
      // Utan preventDefault lägger Chrome sin egen ruta ovanpå appens knapp.
      handelse.preventDefault();
      setPrompt(handelse as InstallPromptEvent);
    };
    const installerades = () => setPrompt(null);

    window.addEventListener("beforeinstallprompt", fanga);
    window.addEventListener("appinstalled", installerades);
    return () => {
      window.removeEventListener("beforeinstallprompt", fanga);
      window.removeEventListener("appinstalled", installerades);
    };
  }, []);

  if (ios) {
    return (
      <p className="mt-8 text-sm text-ink-muted">
        Installera: tryck på Dela och välj «Lägg till på hemskärmen».
      </p>
    );
  }

  if (!prompt) return null;

  return (
    <div className="mt-8">
      <button
        type="button"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-deep"
        onClick={async () => {
          await prompt.prompt();
          // Utfallet läses aldrig: ett nej är webbläsarens sak, och händelsen
          // kommer igen. Men den är engångs — efter prompt() är den förbrukad.
          await prompt.userChoice;
          setPrompt(null);
        }}
      >
        Installera appen
      </button>
    </div>
  );
}
