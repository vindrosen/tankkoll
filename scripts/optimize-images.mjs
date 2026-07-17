// Turns the versioned masters in assets/generated/ into optimized
// public assets. Idempotent — safe to re-run; never regenerates masters.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets", "generated");
const IMAGES = path.join(ROOT, "public", "images");
const ICONS = path.join(ROOT, "public", "icons");

await mkdir(IMAGES, { recursive: true });
await mkdir(ICONS, { recursive: true });

const src = (name) => path.join(SRC, name);

async function cornerAlpha(file) {
  const { data } = await sharp(file)
    .ensureAlpha()
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data[3];
}

async function webp(name, out, { width, height, quality = 82 } = {}) {
  let img = sharp(src(name));
  if (width || height) img = img.resize(width, height, { fit: "cover" });
  const info = await img.webp({ quality }).toFile(path.join(IMAGES, out));
  console.log(`${out}: ${(info.size / 1024).toFixed(0)} kB`);
}

// --- content images -------------------------------------------------
await webp("hero.png", "hero.webp");
await webp("splash.png", "splash.webp");
await webp("empty-tankningar.png", "empty-tankningar.webp", { width: 512, height: 512, quality: 90 });
await webp("empty-bilar.png", "empty-bilar.webp", { width: 512, height: 512, quality: 90 });
await webp("app-icon.png", "logo.webp", { width: 256, height: 256, quality: 90 });

// --- PWA icons ------------------------------------------------------
const iconAlpha = await cornerAlpha(src("app-icon.png"));
console.log(`app-icon corner alpha: ${iconAlpha} (${iconAlpha === 0 ? "transparent" : "OPAQUE"})`);

const BG = "#0f172a";

for (const size of [192, 512]) {
  await sharp(src("app-icon.png"))
    .resize(size, size)
    .flatten({ background: BG })
    .png()
    .toFile(path.join(ICONS, `icon-${size}.png`));
}

// Maskable: safe zone = inner 80%, so scale the glyph to ~70% on solid bg.
const glyph = await sharp(src("app-icon.png")).resize(360, 360).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: BG },
})
  .composite([{ input: glyph, gravity: "center" }])
  .png()
  .toFile(path.join(ICONS, "icon-maskable-512.png"));

await sharp(src("app-icon.png"))
  .resize(180, 180)
  .flatten({ background: BG })
  .png()
  .toFile(path.join(ICONS, "apple-touch-icon.png"));

// Next.js app-router favicon convention: src/app/icon.png
await sharp(src("app-icon.png"))
  .resize(64, 64)
  .flatten({ background: BG })
  .png()
  .toFile(path.join(ROOT, "src", "app", "icon.png"));

// --- OG / social image (1200x630 with composited text) --------------
const ogText = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <text x="72" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="104" font-weight="800" fill="#ffffff">TankKoll</text>
  <text x="76" y="368" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="400" fill="#b6c2d6">Håll koll på din bränsleförbrukning</text>
</svg>`);

const ogInfo = await sharp(src("og-background.png"))
  .resize(1200, 630, { fit: "cover" })
  .composite([{ input: ogText, left: 0, top: 0 }])
  .jpeg({ quality: 88 })
  .toFile(path.join(IMAGES, "og.jpg"));
console.log(`og.jpg: ${(ogInfo.size / 1024).toFixed(0)} kB`);

console.log("Done.");
