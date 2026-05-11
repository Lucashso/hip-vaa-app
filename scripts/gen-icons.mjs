// Gera ícones PWA + apple-touch + og a partir de public/logo-source.png.
// node scripts/gen-icons.mjs

import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../public/logo-source.png");
const PUB = resolve(__dirname, "../public");

const targets = [
  { name: "pwa-192x192.png", size: 192, bg: { r: 255, g: 255, b: 255, alpha: 1 } },
  { name: "pwa-512x512.png", size: 512, bg: { r: 255, g: 255, b: 255, alpha: 1 } },
  { name: "apple-touch-icon.png", size: 180, bg: { r: 255, g: 255, b: 255, alpha: 1 } },
  { name: "favicon-32.png", size: 32, bg: { r: 255, g: 255, b: 255, alpha: 1 } },
];

const ogTarget = { name: "og-image.png", w: 1200, h: 630, bg: { r: 6, g: 24, b: 38, alpha: 1 } };

for (const t of targets) {
  await sharp(SRC)
    .resize(t.size, t.size, { fit: "contain", background: t.bg })
    .flatten({ background: t.bg })
    .png()
    .toFile(resolve(PUB, t.name));
  console.log("✓", t.name);
}

const inner = Math.round(ogTarget.h * 0.7);
await sharp({
  create: { width: ogTarget.w, height: ogTarget.h, channels: 3, background: ogTarget.bg },
})
  .composite([
    {
      input: await sharp(SRC)
        .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .negate({ alpha: false })
        .png()
        .toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toFile(resolve(PUB, ogTarget.name));
console.log("✓", ogTarget.name);

// SVG inline pro favicon (mantém compat)
await sharp(SRC)
  .resize(64, 64, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(resolve(PUB, "favicon.png"));
console.log("✓ favicon.png");

console.log("\nDone.");
