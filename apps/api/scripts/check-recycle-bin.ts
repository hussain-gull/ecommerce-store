// Runnable self-check: `pnpm tsx scripts/check-recycle-bin.ts`
import assert from "node:assert/strict";
import { config } from "../src/config.js";
import { recycleBinPublicId } from "../src/utils/cloudinary.util.js";

const root = config.cloudinaryRootFolder;
const bin = `${root}/recycle-bin`;

assert.equal(recycleBinPublicId(`${root}/product/abc`), `${bin}/product/abc`);
assert.equal(
  recycleBinPublicId(`${root}/payment-qr/x1`),
  `${bin}/payment-qr/x1`,
);
// idempotent — never nests bin/bin
assert.equal(recycleBinPublicId(`${bin}/product/abc`), `${bin}/product/abc`);
// foreign root (not ours) is still namespaced under our bin
assert.equal(recycleBinPublicId("other/x"), `${bin}/other/x`);
console.log("recycle-bin: ok");
