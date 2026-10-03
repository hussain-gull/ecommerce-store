import { useQuery } from "@tanstack/react-query";
import { analyzePaymentText } from "../payment-proof-hints";

// Reads the payment screenshot with OCR in the admin's own browser — no server
// CPU, no OCR dependency in the API, and it scales with the number of admins.
//
// Cost model (what makes this cheap):
//  • tesseract.js is imported lazily, and ONE worker is created on first use and
//    reused for every order (spinning up wasm + the language model is most of the
//    cost); it is terminated after IDLE_MS without work to free its memory.
//  • The image is downscaled and desaturated before recognition — phone
//    screenshots are huge, and OCR time grows with pixel count.
//  • Results are cached per order+image for the session (staleTime: Infinity).
// Worker/wasm/language data come from this app's own /tesseract/ (copied from
// node_modules by scripts/copy-tesseract-assets.mjs) — no third-party CDN.
// Absolute URLs are required: the worker is spawned from a blob, where relative
// paths don't resolve.
const IDLE_MS = 60_000;
const MAX_WIDTH = 1600;

type Worker = Awaited<
  ReturnType<(typeof import("tesseract.js"))["createWorker"]>
>;
let workerPromise: Promise<Worker> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | undefined;

const assetBase = () =>
  new URL(`${import.meta.env.BASE_URL}tesseract/`, window.location.origin).href;

function getWorker(): Promise<Worker> {
  clearTimeout(idleTimer);
  workerPromise ??= import("tesseract.js").then(async ({ createWorker }) => {
    const base = assetBase();
    const w = await createWorker("eng", undefined, {
      workerPath: `${base}worker.min.js`,
      corePath: base,
      langPath: `${base}lang`,
    });
    await w.setParameters({
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });
    return w;
  });
  // A failed start must not poison later attempts.
  workerPromise.catch(() => (workerPromise = null));
  return workerPromise;
}

function releaseLater() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const p = workerPromise;
    workerPromise = null;
    p?.then((w) => w.terminate()).catch(() => {});
  }, IDLE_MS);
}

// Shrinks wide screenshots and boosts contrast. Falls back to the original URL
// when the image can't be read cross-origin (OCR then just runs on the full image).
async function prepare(url: string): Promise<Blob | string> {
  try {
    const blob = await (await fetch(url)).blob();
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_WIDTH / bmp.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return url;
    ctx.filter = "grayscale(1) contrast(1.3)"; // ignored (harmlessly) where unsupported
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("toBlob"))),
        "image/png",
      ),
    );
  } catch {
    return url;
  }
}

export function usePaymentProofAnalysis(
  orderId: string,
  imageUrl: string | undefined,
  expected:
    { total: string; accountNumber: string; submittedAt?: string } | undefined,
) {
  return useQuery({
    queryKey: ["payment-proof-ocr", orderId, imageUrl, expected],
    enabled: !!imageUrl && !!expected,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const [worker, image] = await Promise.all([
        getWorker(),
        prepare(imageUrl!),
      ]);
      try {
        const { data } = await worker.recognize(image);
        return analyzePaymentText(data.text, expected!);
      } finally {
        releaseLater();
      }
    },
  });
}
