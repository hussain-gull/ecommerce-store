// Self-check for findVariant: pnpm tsx scripts/check-find-variant.ts
import assert from "node:assert/strict";
import { findVariant } from "../src/services/stock.service.js";

const v = (size: string | null, name: string | null, hex: string | null) => ({
  size,
  color_name: name,
  color_hex: hex,
});
const one = [v("11", null, "#ef00b4")];
const sizes = [v("8", null, "#e84545"), v("9", null, "#df0000")];
const named = [v(null, "Red", "#f00"), v(null, "Blue", "#00f")];
const plain = [v(null, null, null)];

// card add (no size/colour) on a single-variant product → that variant
assert.equal(findVariant(one, null, null), one[0]);
// exact size match; colour labelled by hex when unnamed
assert.equal(findVariant(sizes, "9", "#df0000"), sizes[1]);
// size only (colour omitted) still resolves when the size is unique
assert.equal(findVariant(sizes, "9", null), sizes[1]);
// colour only resolves when the colour is unique; size-less line on sized product doesn't
assert.equal(findVariant(sizes, null, "#e84545"), sizes[0]);
// same size in two colours + colour omitted → ambiguous, no guess
const twoColours = [v("9", "Red", "#f00"), v("9", "Blue", "#00f")];
assert.equal(findVariant(twoColours, "9", null), undefined);
// stale size on a single-variant product must NOT fall back to it
assert.equal(findVariant(one, "10", null), undefined);
// card add on a multi-size product is ambiguous → no guess
assert.equal(findVariant(sizes, null, null), undefined);
// named colours match by name
assert.equal(findVariant(named, null, "Blue"), named[1]);
assert.equal(findVariant(named, null, null), undefined);
// plain product (null/null variant) exact match
assert.equal(findVariant(plain, null, null), plain[0]);
// stale size the admin removed → none; empty variants → none
assert.equal(findVariant(sizes, "12", null), undefined);
assert.equal(findVariant([], null, null), undefined);
console.log("findVariant: all scenarios pass");
