import type { CartItem } from "./cart.js";
import type { Address } from "./address.js";
import type { ShippingMethod } from "./shipping.js";

export type { Address };

export type OrderStatus =
  "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  size?: string;
  color?: string;
};

export type Order = {
  id: string;
  items: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
};

export type PlaceOrderPayload = {
  /** Client-generated UUID per checkout attempt — a repeat returns the same order. */
  idempotencyKey: string;
  contactEmail: string;
  contactPhone?: string;
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  /** JazzCash payment screenshot, uploaded via POST /media/payment-upload. */
  paymentScreenshotUrl: string;
};

/**
 * Result of POST /orders. Money fields are decimal strings (never floats);
 * `totalPrice` is the grand total (items + shipping) the customer paid.
 */
export type PlacedOrder = {
  id: string;
  /** "pending" = payment submitted, awaiting admin verification. */
  status: OrderStatus;
  totalPrice: string;
  shippingCost: string;
  createdAt: string;
};

export type AdminOrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: string;
  size?: string;
  color?: string;
};

/** One status transition; the first event of every order is "pending" at placement. */
export type OrderEvent = { status: OrderStatus; at: string };

export type AdminOrder = PlacedOrder & {
  /** Oldest first — drives the customer's payment/fulfilment timeline. */
  events: OrderEvent[];
  contactEmail: string;
  contactPhone?: string;
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  paymentScreenshotUrl?: string;
  paymentSubmittedAt?: string;
  items: AdminOrderItem[];
};

/** What `GET /orders/mine` returns — the customer's own orders, same shape the admin sees. */
export type CustomerOrder = AdminOrder;

/** Orders per status — tab badges and the sidebar's "verify payment" count. */
export type AdminOrderCounts = Record<OrderStatus | "all", number>;
