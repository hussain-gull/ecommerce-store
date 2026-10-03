import {
  formatMoney,
  shippingCostMinor,
  type Address,
  type AdminOrder,
  type AdminOrderCounts,
  type AdminOrdersQuery,
  type PaginationMeta,
  type CustomerOrder,
  type OrderStatus,
  type PlaceOrderPayload,
  type PlacedOrder,
  type ShippingMethod,
} from "@ecommerce/contracts";
import { or } from "@prisma/orm-postgres/orm-client";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { uuidv7 } from "../utils/uuid.util.js";
import { createHttpError } from "../utils/response.util.js";
import { buildFolder, publicIdFromUrl } from "../utils/cloudinary.util.js";
import { getPaymentContentService } from "./content.service.js";
import { adjustStock, findVariant, type Tx } from "./stock.service.js";
import { invalidatePublishedProductsCache } from "./product.service.js";
import {
  sendOrderAcceptedEmail,
  sendPaymentReceivedEmail,
} from "../utils/email.util.js";

// Only the shared Address fields go into the snapshot (no client-supplied extras).
const shipAddress = (a: Address): Address => ({
  firstName: a.firstName,
  lastName: a.lastName,
  line1: a.line1,
  ...(a.line2 ? { line2: a.line2 } : {}),
  city: a.city,
  postcode: a.postcode,
  country: a.country,
});

// Decimal strings <-> integer minor units, so totals never touch floats.
const toMinor = (s: string): bigint => {
  const [i = "0", f = ""] = s.split(".");
  return BigInt(i) * 100n + BigInt((f + "00").slice(0, 2));
};
const fromMinor = (n: bigint): string =>
  `${n / 100n}.${String(n % 100n).padStart(2, "0")}`;

// ── mappers ───────────────────────────────────────────────────────────────────

function rowToPlaced(row: {
  id: string;
  status: string;
  total_price: string;
  shipping_cost: string;
  created_at: string;
}): PlacedOrder {
  return {
    id: row.id,
    status: row.status as OrderStatus,
    totalPrice: row.total_price,
    shippingCost: row.shipping_cost,
    createdAt: row.created_at,
  };
}

// A payment screenshot must be one *this user* uploaded via /media/payment-upload
// (so nobody can attach an arbitrary or someone else's image as "proof").
// Uploads are tracked in review_media_uploads — same shape, and its daily cron
// already recycles rows (+ moves the Cloudinary asset to the bin) that never got attached to anything.
async function assertOwnPaymentProof(
  userId: string,
  url: string,
): Promise<void> {
  const publicId = publicIdFromUrl(url);
  const upload = await db.orm.public.review_media_uploads
    .select("id")
    .where({ url, user_id: userId })
    .first();
  if (
    !publicId ||
    !publicId.startsWith(`${buildFolder("payment")}/`) ||
    !upload
  ) {
    throw createHttpError(400, "Invalid payment screenshot.");
  }
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return (
    e?.code === "23505" ||
    /duplicate key|unique constraint/i.test(e?.message ?? "")
  );
}

// ── customer ──────────────────────────────────────────────────────────────────

async function findByIdempotencyKey(
  userId: string,
  key: string,
): Promise<PlacedOrder | null> {
  const row = await db.orm.public.orders
    .where({ user_id: userId, idempotency_key: key })
    .first();
  return row ? rowToPlaced(row) : null;
}

// Places an order from the user's server-side cart with the JazzCash payment
// screenshot attached (status "pending" = awaiting admin verification).
//   • Idempotent: a repeat of the same key returns the original order.
//   • Oversell-safe: every variant is decremented with a compare-and-swap; any
//     sold-out line throws a 409 and the whole transaction rolls back.
export async function placeOrderService(
  userId: string,
  payload: PlaceOrderPayload,
): Promise<PlacedOrder> {
  const replay = await findByIdempotencyKey(userId, payload.idempotencyKey);
  if (replay) return replay;

  const pay = await getPaymentContentService();
  if (!pay.accountNumber) {
    throw createHttpError(
      503,
      "Payments are not set up yet. Please try later.",
    );
  }
  await assertOwnPaymentProof(userId, payload.paymentScreenshotUrl);

  const cart = await db.orm.public.cart_items
    .where({ user_id: userId })
    .orderBy((c) => c.id.asc())
    .all();
  if (cart.length === 0) {
    // Double-click race: a concurrent request with the same key may have
    // committed (and emptied the cart) between our replay check and this read.
    const raced = await findByIdempotencyKey(userId, payload.idempotencyKey);
    if (raced) return raced;
    throw createHttpError(400, "Your cart is empty.");
  }

  let placed: PlacedOrder;
  try {
    placed = await db.transaction(async (tx) => {
      const orderId = uuidv7();
      let subtotal = 0n;
      const soldOut: string[] = [];
      const lines: {
        product_id: string;
        quantity: number;
        price: string;
        size: string | null;
        color: string | null;
      }[] = [];

      for (const item of cart) {
        const product = await tx.orm.public.products
          .where({ id: item.product_id, is_published: true, deleted_at: null })
          .first();
        if (!product) {
          soldOut.push(item.product_id);
          continue;
        }

        // Every sellable product has ≥1 variant row carrying its stock (a
        // plain product is one variant with null size/color). No row = no stock.
        const variants = await tx.orm.public.product_variants
          .where({ product_id: product.id })
          .all();
        const variant = findVariant(variants, item.size, item.color);
        if (!variant || !(await adjustStock(tx, variant.id, -item.quantity))) {
          soldOut.push(item.product_id);
          continue;
        }

        const unit = product.sale_price ?? product.price;
        subtotal += toMinor(unit) * BigInt(item.quantity);
        lines.push({
          product_id: product.id,
          quantity: item.quantity,
          price: unit,
          size: item.size,
          color: item.color,
        });
      }

      // Throwing rolls back every decrement made above.
      if (soldOut.length > 0) {
        throw Object.assign(
          createHttpError(409, "Some items are sold out or low on stock."),
          {
            errors: soldOut.map((id) => ({
              field: id,
              message: "Sold out or insufficient stock.",
            })),
          },
        );
      }

      const shipping = BigInt(
        shippingCostMinor(payload.shippingMethod, Number(subtotal)),
      );
      const total = subtotal + shipping;
      const now = nowUtc();
      const a = payload.shippingAddress;

      const order = await tx.orm.public.orders.create({
        id: orderId,
        user_id: userId,
        status: "pending",
        total_price: fromMinor(total),
        created_at: now,
        idempotency_key: payload.idempotencyKey,
        contact_email: payload.contactEmail,
        contact_phone: payload.contactPhone ?? null,
        ship_address: shipAddress(a),
        customer_name: `${a.firstName} ${a.lastName}`.trim(),
        shipping_method: payload.shippingMethod,
        shipping_cost: fromMinor(shipping),
        payment_screenshot_url: payload.paymentScreenshotUrl,
        payment_submitted_at: now,
      });
      await tx.orm.public.order_events.create({
        id: uuidv7(),
        order_id: orderId,
        status: "pending",
        created_at: now as any,
      });
      for (const line of lines) {
        await tx.orm.public.order_items.create({
          id: uuidv7(),
          order_id: orderId,
          ...line,
        });
      }
      await tx.orm.public.cart_items
        .where({ user_id: userId })
        .deleteAndCount();
      // Screenshot is now attached — stop the stale-upload cron from purging it.
      await tx.orm.public.review_media_uploads
        .where({ url: payload.paymentScreenshotUrl })
        .delete();
      return rowToPlaced(order);
    });
  } catch (err) {
    // A concurrent request with the same key won the unique index — that
    // transaction rolled back ours (stock included); hand back theirs.
    if (isUniqueViolation(err)) {
      const existing = await findByIdempotencyKey(
        userId,
        payload.idempotencyKey,
      );
      if (existing) return existing;
    }
    throw err;
  }

  await invalidatePublishedProductsCache();

  // Best-effort: a mail failure must never fail an order that already committed.
  getPaymentContentService()
    .then(({ supportPhone }) =>
      sendPaymentReceivedEmail({
        to: payload.contactEmail,
        firstName: payload.shippingAddress.firstName,
        orderId: placed.id,
        total: formatMoney(placed.totalPrice),
        supportPhone,
      }),
    )
    .catch((e) => console.error("Payment-received email failed:", e));

  return placed;
}

// ── admin ─────────────────────────────────────────────────────────────────────

const newestOrders = () => db.orm.public.orders.orderBy((o) => o.id.desc());
type OrderRow = Awaited<
  ReturnType<ReturnType<typeof newestOrders>["all"]>
>[number];

const likeEscape = (v: string) => v.replace(/[\\%_]/g, "\\$&");

// Status tab + search + page are all applied in SQL; only the requested page is
// hydrated (items/product names/events), however many orders exist.
export async function listAdminOrdersService(
  query: AdminOrdersQuery,
): Promise<{ orders: AdminOrder[]; meta: PaginationMeta }> {
  let c = db.orm.public.orders.where((o) => o.id.isNotNull());
  if (query.status) c = c.where({ status: query.status });
  if (query.shippingMethod) {
    c = c.where({ shipping_method: query.shippingMethod });
  }
  if (query.from) c = c.where((o) => o.created_at.gte(query.from!));
  if (query.to) c = c.where((o) => o.created_at.lt(query.to!));
  if (query.q) {
    const like = `%${likeEscape(query.q)}%`;
    c = c.where((o) =>
      or(
        o.id.ilike(like),
        o.contact_email.ilike(like),
        o.contact_phone.ilike(like),
        o.customer_name.ilike(like),
      ),
    );
  }
  const { n: total } = await c.aggregate((a) => ({ n: a.count() }));
  const rows = await c
    // UUIDv7 ids are time-ordered, so id order is placement order.
    .orderBy((o) => (query.sort === "oldest" ? o.id.asc() : o.id.desc()))
    .limit(query.limit)
    .offset((query.page - 1) * query.limit)
    .all();
  return {
    orders: await hydrateOrders(rows),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function adminOrderCountsService(): Promise<AdminOrderCounts> {
  const rows = await db.orm.public.orders
    .groupBy("status")
    .aggregate((a) => ({ n: a.count() }));
  const counts: AdminOrderCounts = {
    all: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const r of rows) {
    counts[r.status as OrderStatus] = r.n;
    counts.all += r.n;
  }
  return counts;
}

// A customer's own orders, newest first (UUIDv7 ids are time-ordered).
export const listMyOrdersService = async (
  userId: string,
): Promise<CustomerOrder[]> =>
  hydrateOrders(
    await db.orm.public.orders
      .where({ user_id: userId })
      .orderBy((o) => o.id.desc())
      .all(),
  );

async function hydrateOrders(orders: OrderRow[]): Promise<AdminOrder[]> {
  if (orders.length === 0) return [];

  const items = await db.orm.public.order_items
    .where((i) => i.order_id.in(orders.map((o) => o.id)))
    .all();
  const products = await db.orm.public.products
    .select("id", "name")
    .where((p) => p.id.in([...new Set(items.map((i) => i.product_id))]))
    .all();
  const names = new Map(products.map((p) => [p.id, p.name]));
  const events = await db.orm.public.order_events
    .where((e) => e.order_id.in(orders.map((o) => o.id)))
    .orderBy((e) => e.created_at.asc())
    .all();

  return orders.map((o) => ({
    ...rowToPlaced(o),
    contactEmail: o.contact_email,
    ...(o.contact_phone ? { contactPhone: o.contact_phone } : {}),
    shippingAddress: o.ship_address as Address,
    events: events
      .filter((e) => e.order_id === o.id)
      .map((e) => ({ status: e.status as OrderStatus, at: e.created_at })),
    shippingMethod: o.shipping_method as ShippingMethod,
    ...(o.payment_screenshot_url
      ? { paymentScreenshotUrl: o.payment_screenshot_url }
      : {}),
    ...(o.payment_submitted_at
      ? { paymentSubmittedAt: o.payment_submitted_at }
      : {}),
    items: items
      .filter((i) => i.order_id === o.id)
      .map((i) => ({
        productId: i.product_id,
        name: names.get(i.product_id) ?? "Removed product",
        quantity: i.quantity,
        price: i.price,
        ...(i.size ? { size: i.size } : {}),
        ...(i.color ? { color: i.color } : {}),
      })),
  }));
}

// Moves an order between statuses only from the expected current status, so a
// double-click (or two admins) can't fire the customer email twice or restock twice.
async function transition(
  tx: Tx,
  id: string,
  from: OrderStatus[],
  to: OrderStatus,
): Promise<void> {
  const row = await tx.orm.public.orders.where({ id }).first();
  if (!row) throw createHttpError(404, "Order not found.");
  const plan = tx.sql.public.orders
    .update({ status: to })
    .where((f, fns) => fns.and(fns.eq(f.id, id), fns.eq(f.status, row.status)))
    .build();
  if (
    !from.includes(row.status as OrderStatus) ||
    (await tx.execute(plan)).affectedRows !== 1
  ) {
    throw createHttpError(409, `Order is already ${row.status}.`);
  }
  await tx.orm.public.order_events.create({
    id: uuidv7(),
    order_id: id,
    status: to,
    created_at: nowUtc() as any,
  });
}

export async function confirmOrderService(id: string): Promise<void> {
  await db.transaction((tx) => transition(tx, id, ["pending"], "processing"));

  const order = await db.orm.public.orders.where({ id }).first();
  if (!order) return;
  getPaymentContentService()
    .then(({ supportPhone }) =>
      sendOrderAcceptedEmail({
        to: order.contact_email,
        firstName: (order.ship_address as Address).firstName,
        orderId: order.id,
        total: formatMoney(order.total_price),
        supportPhone,
      }),
    )
    .catch((e) => console.error("Order-accepted email failed:", e));
}

// Fulfilment: processing → shipped → delivered (delivered may also be set
// straight from processing). Delivered orders can leave a store review.
export async function updateOrderStatusService(
  id: string,
  status: "shipped" | "delivered",
): Promise<void> {
  await db.transaction((tx) =>
    transition(
      tx,
      id,
      status === "shipped" ? ["processing"] : ["processing", "shipped"],
      status,
    ),
  );
}

// Rejecting (e.g. fake screenshot) returns the reserved stock. order_items has
// no variant id — variant rows are recreated on every admin product edit — so
// the variant is matched on product + size + color.
export async function cancelOrderService(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await transition(tx, id, ["pending", "processing"], "cancelled");

    const items = await tx.orm.public.order_items.where({ order_id: id }).all();
    for (const item of items) {
      const variant = findVariant(
        await tx.orm.public.product_variants
          .where({ product_id: item.product_id })
          .all(),
        item.size,
        item.color,
      );
      // Variant gone (admin removed it) → nothing to restock.
      if (variant) await adjustStock(tx, variant.id, item.quantity);
    }
  });
  await invalidatePublishedProductsCache();
}
