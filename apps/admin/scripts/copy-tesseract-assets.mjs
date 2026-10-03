// Copies the OCR runtime (worker, wasm core, English language data) from
// node_modules into public/tesseract/ so the admin serves it itself and never
// depends on a third-party CDN at runtime. Runs before `dev` and `build`; the
// output is gitignored (~13MB of generated binaries).
import { copyFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const out = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/tesseract",
);
mkdirSync(join(out, "lang"), { recursive: true });

const tessDir = dirname(require.resolve("tesseract.js/package.json"));
// tesseract.js-core is tesseract.js's own dependency — resolve it from there
// (pnpm's strict node_modules doesn't hoist it to this app).
const coreDir = dirname(
  createRequire(join(tessDir, "package.json")).resolve(
    "tesseract.js-core/package.json",
  ),
);
const dataDir = dirname(require.resolve("@tesseract.js-data/eng/package.json"));

// Only the LSTM-only builds are needed (tesseract.js picks by CPU features);
// the legacy-engine builds are ~4MB each and never requested by default.
const files = [
  [join(tessDir, "dist/worker.min.js"), "worker.min.js"],
  ...[
    "tesseract-core-relaxedsimd-lstm.wasm.js",
    "tesseract-core-simd-lstm.wasm.js",
    "tesseract-core-lstm.wasm.js",
  ].map((f) => [join(coreDir, f), f]),
  [
    join(dataDir, "4.0.0_best_int/eng.traineddata.gz"),
    "lang/eng.traineddata.gz",
  ],
];

for (const [src, name] of files) {
  if (!existsSync(src)) throw new Error(`OCR asset missing: ${src}`);
  const dest = join(out, name);
  if (!existsSync(dest) || statSync(dest).size !== statSync(src).size) {
    copyFileSync(src, dest);
  }
}
console.log(`OCR assets ready in ${out}`);
