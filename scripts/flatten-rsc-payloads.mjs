/**
 * Gör Next.js förhämtning användbar i den statiska exporten.
 *
 * BAKGRUND
 * Next 16:s router förhämtar RSC-nyttolaster per ruttsegment. Vid `next build`
 * med `output: "export"` skrivs de som en katalogstruktur:
 *
 *     out/fiskar/gadda/__next.fiskar/$d$slug.txt
 *     out/om/__next.om/__PAGE__.txt
 *
 * ...men routern begär dem punktseparerade, som platta filnamn:
 *
 *     /fiskar/gadda/__next.fiskar.$d$slug.txt
 *     /om/__next.om.__PAGE__.txt
 *
 * Filerna finns alltså – under fel namn. På en server med omskrivningsregler
 * spelar det ingen roll, men GitHub Pages serverar filer rakt av. Följden blir
 * ett 404-regn i konsolen (18 st på startsidan) och att förhämtningen aldrig
 * fungerar, så varje klick måste hämta sidan på nytt.
 *
 * ÅTGÄRD
 * Skriptet kopierar varje fil ur en `__next.<segment>/`-katalog till en platt
 * granne med punkter i namnet, så att det routern ber om faktiskt finns.
 * Originalen lämnas kvar – de är små och kan användas av andra värdar.
 *
 * Körs automatiskt som `postbuild`. Om Next någon gång börjar skriva filerna
 * platt direkt blir skriptet en tom operation, inte ett fel.
 */

import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "out");

/** Prefixet Next använder för segmentnyttolaster. */
const SEGMENT_PREFIX = "__next.";

let copied = 0;

/**
 * Plattar ut en `__next.*`-katalog.
 *
 * @param dir Katalogen som gås igenom.
 * @param targetDir Katalogen de platta filerna ska hamna i.
 * @param prefix Namnet som byggts upp så här långt, t.ex. "__next.fiskar".
 */
async function flatten(dir, targetDir, prefix) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Nästlade segment blir ytterligare en punkt i namnet.
      await flatten(full, targetDir, `${prefix}.${entry.name}`);
    } else {
      await copyFile(full, path.join(targetDir, `${prefix}.${entry.name}`));
      copied += 1;
    }
  }
}

/** Letar upp alla `__next.*`-kataloger i exporten. */
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const full = path.join(dir, entry.name);
    if (entry.name.startsWith(SEGMENT_PREFIX)) {
      await flatten(full, path.dirname(full), entry.name);
    } else {
      await walk(full);
    }
  }
}

async function main() {
  try {
    await walk(OUT_DIR);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`Hittade ingen export i ${OUT_DIR} – kör "next build" först.`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  console.log(`Förhämtning: plattade ut ${copied} segmentfiler i out/`);
}

main();
