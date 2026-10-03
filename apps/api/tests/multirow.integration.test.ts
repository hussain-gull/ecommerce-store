// Regression tests for multi-row deletes. In this ORM `.where(...).delete()`
// removes exactly ONE row even when many match — multi-row deletes must use
// `.deleteAndCount()`. See orders.integration.test.ts for how to run.
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

const url = process.env["TEST_DATABASE_URL"];
if (!url || !/test|scratch/i.test(new URL(url).pathname)) {
  throw new Error(
    "Set TEST_DATABASE_URL to a scratch database whose name contains 'test' or 'scratch'.",
  );
}
process.env["DATABASE_URL"] = url;
process.env["RESEND_API_KEY"] = "";
// Product edits/deletes recycle Cloudinary assets — never hit the real account.
process.env["CLOUDINARY_CLOUD_NAME"] = "";

const { db } = await import("../src/prisma/db.js");
const { uuidv7 } = await import("../src/utils/uuid.util.js");
const { nowUtc } = await import("../src/utils/datetime.util.js");
const orders = await import("../src/services/order.service.js");
const products = await import("../src/services/product.service.js");
const wishlist = await import("../src/services/wishlist.service.js");
const cart = await import("../src/services/cart.service.js");
const content = await import("../src/services/content.service.js");

const now = () => nowUtc() as any;
const uid = () => uuidv7().replace(/-/g, "").slice(-12);

async function seedUser() {
  const id = crypto.randomUUID();
  await db.orm.public.users.create({
    id,
    first_name: "T",
    last_name: "U",
    email: `${uid()}@test.local`,
    password_hash: "x",
    phone_number: "0300",
    created_at: now(),
  });
  return id;
}

async function seedProduct(stock = 10) {
  const id = uuidv7();
  await db.orm.public.products.create({
    id,
    slug: `p-${uid()}`,
    name: "Boot",
    description: "d",
    price: "500.00",
    sku: `sku-${uid()}`,
    category: "boots",
    tags: [],
    is_published: true,
    created_at: now(),
    updated_at: now(),
  });
  await db.orm.public.product_variants.create({
    id: uuidv7(),
    product_id: id,
    size: "8",
    color_name: "Red",
    color_hex: "#ff0000",
    stock,
  });
  return id;
}

const addToCart = (userId: string, productId: string) =>
  db.orm.public.cart_items.create({
    id: uuidv7(),
    user_id: userId,
    product_id: productId,
    quantity: 1,
    size: null,
    color: null,
    added_at: now(),
  });

const cartRows = (userId: string) =>
  db.orm.public.cart_items.where({ user_id: userId }).all();

describe("multi-row deletes", () => {
  after(async () => {
    await db.close?.();
  });

  it("placing a 3-item order empties the whole cart", async () => {
    await content.updatePaymentContentService({
      accountName: "S",
      accountNumber: "0300",
      supportPhone: "1",
      qrImage: "",
    });
    const u = await seedUser();
    for (let i = 0; i < 3; i++) await addToCart(u, await seedProduct());
    assert.equal((await cartRows(u)).length, 3);

    const shot = `https://res.cloudinary.com/x/image/upload/v1/store/payment/${uid()}.png`;
    await db.orm.public.review_media_uploads.create({
      id: uuidv7(),
      user_id: u,
      url: shot,
      created_at: now(),
    });
    await orders.placeOrderService(u, {
      idempotencyKey: crypto.randomUUID(),
      contactEmail: "b@test.local",
      shippingAddress: {
        firstName: "A",
        lastName: "B",
        line1: "1",
        city: "K",
        postcode: "1",
        country: "Pakistan",
      },
      shippingMethod: "standard",
      paymentScreenshotUrl: shot,
    });
    assert.equal((await cartRows(u)).length, 0);
  });

  it("clearing the cart and the wishlist removes every row", async () => {
    const u = await seedUser();
    const [a, b, c] = [
      await seedProduct(),
      await seedProduct(),
      await seedProduct(),
    ];
    for (const p of [a, b, c]) {
      await addToCart(u, p);
      await db.orm.public.wishlist_items.create({
        id: uuidv7(),
        user_id: u,
        product_id: p,
        added_at: now(),
      });
    }
    await cart.clearCartService(u);
    await wishlist.clearWishlistService(u);
    assert.equal((await cartRows(u)).length, 0);
    assert.equal(
      (await db.orm.public.wishlist_items.where({ user_id: u }).all()).length,
      0,
    );
  });

  it("deleting a product removes it from every user's cart and wishlist", async () => {
    const p = await seedProduct();
    const users = [await seedUser(), await seedUser(), await seedUser()];
    for (const u of users) {
      await addToCart(u, p);
      await db.orm.public.wishlist_items.create({
        id: uuidv7(),
        user_id: u,
        product_id: p,
        added_at: now(),
      });
    }
    await products.deleteProductService(p);
    assert.equal(
      (await db.orm.public.cart_items.where({ product_id: p }).all()).length,
      0,
    );
    assert.equal(
      (await db.orm.public.wishlist_items.where({ product_id: p }).all())
        .length,
      0,
    );
  });

  it("replacing a product gallery leaves exactly the new media, not old + new", async () => {
    const p = await seedProduct();
    const img = (n: number) => ({
      type: "image" as const,
      url: `https://res.cloudinary.com/x/image/upload/v1/store/product/${uid()}-${n}.png`,
    });
    await products.updateProductService(p, { media: [img(1), img(2), img(3)] });
    const second = [img(4), img(5)];
    await products.updateProductService(p, { media: second });

    const rows = await db.orm.public.product_media
      .where({ product_id: p })
      .all();
    assert.deepEqual(
      rows.map((r) => r.url).sort(),
      second.map((m) => m.url).sort(),
    );
  });
});
