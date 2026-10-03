// Self-check for the customer timeline:
//   pnpm tsx --tsconfig ../web/tsconfig.json scripts/check-order-timeline.ts  (web path aliases)
import assert from "node:assert/strict";
import type { CustomerOrder, OrderStatus } from "@ecommerce/contracts";
import { buildSteps } from "../../web/components/account/orders-panel.tsx";

const order = (status: OrderStatus, path: OrderStatus[]) =>
  ({
    id: "x",
    status,
    createdAt: "2026-10-02T09:00:00Z",
    events: path.map((s, i) => ({
      status: s,
      at: `2026-10-02T0${9 + i}:00:00Z`,
    })),
  }) as unknown as CustomerOrder;
const view = (o: CustomerOrder) =>
  buildSteps(o)
    .map((s) => `${s.key}:${s.state}`)
    .join(" ");

assert.equal(
  view(order("pending", ["pending"])),
  "placed:done verify:current accepted:todo shipped:todo delivered:todo",
);
assert.equal(
  view(order("processing", ["pending", "processing"])),
  "placed:done verify:done accepted:done shipped:current delivered:todo",
);
assert.equal(
  view(order("shipped", ["pending", "processing", "shipped"])),
  "placed:done verify:done accepted:done shipped:done delivered:current",
);
assert.equal(
  view(order("delivered", ["pending", "processing", "shipped", "delivered"])),
  "placed:done verify:done accepted:done shipped:done delivered:done",
);
// Rejected at verification: terminal red step, nothing after it.
assert.equal(
  view(order("cancelled", ["pending", "cancelled"])),
  "placed:done verify:failed",
);
// Cancelled after acceptance: verification passed, then a red cancelled step.
assert.equal(
  view(order("cancelled", ["pending", "processing", "cancelled"])),
  "placed:done verify:done accepted:done cancelled:failed",
);
// Orders with no recorded events still render (falls back to createdAt).
assert.equal(
  buildSteps({ ...order("pending", []), events: [] } as CustomerOrder)[0]!.at,
  "2026-10-02T09:00:00Z",
);
console.log("order timeline: all scenarios pass");
