// Self-check: pnpm tsx scripts/check-product-schema.ts
import assert from "node:assert/strict";
import { createProductSchema } from "@ecommerce/contracts";
const base = {
  slug: "a-b",
  name: "n",
  description: "d",
  price: "100",
  sku: "s",
  category: "c",
  variants: [{ size: "8", colorName: "Red", colorHex: "#ff0000", stock: 1 }],
};
const ok = (o: any) => createProductSchema.safeParse(o).success;
assert.ok(ok(base));
assert.ok(ok({ ...base, salePrice: "80" }));
assert.ok(!ok({ ...base, salePrice: "abc" }));
assert.ok(!ok({ ...base, variants: [] }));
assert.ok(!ok({ ...base, variants: undefined }));
for (const bad of [
  { size: "" },
  { colorName: "" },
  { colorHex: "" },
  { colorHex: "red" },
  { size: undefined },
])
  assert.ok(
    !ok({ ...base, variants: [{ ...base.variants[0], ...bad }] }),
    JSON.stringify(bad),
  );
console.log("schema scenarios pass");
