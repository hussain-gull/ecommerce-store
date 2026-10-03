// Order-flow integration tests against a REAL Postgres.
//   TEST_DATABASE_URL=postgres://…/ecommerce_scratch_test pnpm test:integration
// The database must already have the schema (`DATABASE_URL=… pnpm prisma db migrate`).
// Refuses to run against anything whose name doesn't look like a test database,
// because these tests create users/products/orders.
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const url = process.env["TEST_DATABASE_URL"];
if (!url || !/test|scratch/i.test(new URL(url).pathname)) {
  throw new Error(
    "Set TEST_DATABASE_URL to a scratch database whose name contains 'test' or 'scratch'.",
  );
}
process.env["DATABASE_URL"] = url;
// Never send real email from tests: an empty key = the API's dev/stdout mode
// (dotenv won't override a variable that is already set).
process.env["RESEND_API_KEY"] = "";

const { db } = await import("../src/prisma/db.js");
const { uuidv7 } = await import("../src/utils/uuid.util.js");
const { nowUtc } = await import("../src/utils/datetime.util.js");
const orders = await import("../src/services/order.service.js");
const products = await import("../src/services/product.service.js");
const content = await import("../src/services/content.service.js");

const now = () => nowUtc() as any;
const uid = () => uuidv7().replace(/-/g, "").slice(-12);

async function seedUser() {
  const id = crypto.randomUUID();
  await db.orm.public.users.create({
    id,
    first_name: "Test",
    last_name: "User",
    email: `${uid()}@test.local`,
    password_hash: "x",
    phone_number: "0300",
    created_at: now(),
  });
  return id;
}

// One published product with one plain variant (size/color null).
async function seedProduct(stock: number, opts: { variant?: boolean } = {}) {
  const id = uuidv7();
  await db.orm.public.products.create({
    id,
    slug: `p-${uid()}`,
    name: "Boot",
    description: "d",
    price: "1000.00",
    sku: `sku-${uid()}`,
    category: "boots",
    tags: [],
    is_published: true,
    created_at: now(),
    updated_at: now(),
  });
  let variantId: string | undefined;
  if (opts.variant !== false) {
    variantId = uuidv7();
    await db.orm.public.product_variants.create({
      id: variantId,
      product_id: id,
      size: "8",
      color_name: "Red",
      color_hex: "#ff0000",
      stock,
    });
  }
  return { id, variantId: variantId! };
}

const stockOf = async (variantId: string) =>
  (await db.orm.public.product_variants.where({ id: variantId }).first())!
    .stock;

async function addToCart(userId: string, productId: string, quantity = 1) {
  await db.orm.public.cart_items.create({
    id: uuidv7(),
    user_id: userId,
    product_id: productId,
    quantity,
    size: null,
    color: null,
    added_at: now(),
  });
}

// A screenshot the user "uploaded" (tracked like /media/payment-upload does).
async function seedScreenshot(userId: string) {
  const shot = `https://res.cloudinary.com/x/image/upload/v1/store/payment/${uid()}.png`;
  await db.orm.public.review_media_uploads.create({
    id: uuidv7(),
    user_id: userId,
    url: shot,
    created_at: now(),
  });
  return shot;
}

const payload = (key: string, shot: string) => ({
  idempotencyKey: key,
  contactEmail: "buyer@test.local",
  shippingAddress: {
    firstName: "A",
    lastName: "B",
    line1: "1 Street",
    city: "Karachi",
    postcode: "74000",
    country: "Pakistan",
  },
  shippingMethod: "standard" as const,
  paymentScreenshotUrl: shot,
});

async function place(userId: string, key = crypto.randomUUID()) {
  return orders.placeOrderService(
    userId,
    payload(key, await seedScreenshot(userId)),
  );
}

const status = (e: unknown) => (e as { statusCode?: number }).statusCode;

describe("order flow", () => {
  before(async () => {
    await content.updatePaymentContentService({
      accountName: "Test Shop",
      accountNumber: "03001234567",
      supportPhone: "0300",
      qrImage: "",
    });
  });
  after(async () => {
    await db.close?.();
  });

  it("two buyers, one unit: exactly one wins, stock never goes negative", async () => {
    const p = await seedProduct(1);
    const [u1, u2] = [await seedUser(), await seedUser()];
    await addToCart(u1, p.id);
    await addToCart(u2, p.id);

    const results = await Promise.allSettled([place(u1), place(u2)]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const bad = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    assert.equal(ok.length, 1);
    assert.equal(bad.length, 1);
    assert.equal(status(bad[0]!.reason), 409);
    assert.equal(await stockOf(p.variantId), 0);
  });

  it("same idempotency key (concurrent double-click): one order, stock taken once", async () => {
    const p = await seedProduct(5);
    const u = await seedUser();
    await addToCart(u, p.id, 2);
    const key = crypto.randomUUID();
    const shot = await seedScreenshot(u);

    const [a, b] = await Promise.all([
      orders.placeOrderService(u, payload(key, shot)),
      orders.placeOrderService(u, payload(key, shot)),
    ]);
    assert.equal(a.id, b.id);
    assert.equal(await stockOf(p.variantId), 3);
    const rows = await db.orm.public.orders
      .where({ user_id: u, idempotency_key: key })
      .all();
    assert.equal(rows.length, 1);

    // and a later retry still returns the same order
    const c = await orders.placeOrderService(u, payload(key, shot));
    assert.equal(c.id, a.id);
  });

  it("a product with no variant row cannot be bought", async () => {
    const p = await seedProduct(0, { variant: false });
    const u = await seedUser();
    await addToCart(u, p.id);
    await assert.rejects(place(u), (e) => status(e) === 409);
  });

  it("cancel returns stock exactly once; a second cancel is a 409", async () => {
    const p = await seedProduct(4);
    const u = await seedUser();
    await addToCart(u, p.id, 3);
    const o = await place(u);
    assert.equal(await stockOf(p.variantId), 1);

    await orders.cancelOrderService(o.id);
    assert.equal(await stockOf(p.variantId), 4);
    await assert.rejects(
      orders.cancelOrderService(o.id),
      (e) => status(e) === 409,
    );
    assert.equal(await stockOf(p.variantId), 4);
  });

  it("confirm is once-only; fulfilment goes processing → shipped → delivered", async () => {
    const p = await seedProduct(3);
    const u = await seedUser();
    await addToCart(u, p.id);
    const o = await place(u);

    // can't ship/deliver before payment is confirmed
    await assert.rejects(
      orders.updateOrderStatusService(o.id, "delivered"),
      (e) => status(e) === 409,
    );
    await orders.confirmOrderService(o.id);
    await assert.rejects(
      orders.confirmOrderService(o.id),
      (e) => status(e) === 409,
    );
    await orders.updateOrderStatusService(o.id, "shipped");
    await orders.updateOrderStatusService(o.id, "delivered");
    const row = await db.orm.public.orders.where({ id: o.id }).first();
    assert.equal(row!.status, "delivered");
    // delivered orders can no longer be cancelled/restocked
    await assert.rejects(
      orders.cancelOrderService(o.id),
      (e) => status(e) === 409,
    );
  });

  it("editing a product never overwrites stock sold while the form was open", async () => {
    const p = await seedProduct(5);
    const u = await seedUser();
    await addToCart(u, p.id, 2);
    await place(u); // stock 5 → 3 while an admin form (loaded at 5) is open

    // admin saves without touching stock: stock 5 / baseStock 5 → no change
    await products.updateProductService(p.id, {
      variants: [
        {
          id: p.variantId,
          size: "8",
          colorName: "Red",
          colorHex: "#ff0000",
          stock: 5,
          baseStock: 5,
        },
      ],
    });
    assert.equal(await stockOf(p.variantId), 3);

    // admin adds 3 units (form 5 → 8): applied on top of live stock → 6
    await products.updateProductService(p.id, {
      variants: [
        {
          id: p.variantId,
          size: "8",
          colorName: "Red",
          colorHex: "#ff0000",
          stock: 8,
          baseStock: 5,
        },
      ],
    });
    assert.equal(await stockOf(p.variantId), 6);

    // the variant row (and so its id) survived both edits
    const rows = await db.orm.public.product_variants
      .where({ product_id: p.id })
      .all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.id, p.variantId);
  });
});
