"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CreditCard, Truck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { JazzCashPayment } from "./jazzcash-payment";
import { useQueryClient } from "@tanstack/react-query";
import { ORDERS_KEY } from "@/lib/hooks/use-orders";
import { useAuthStore } from "@/lib/store/auth.store";
import { useCartStore } from "@/lib/store/cart.store";
import { placeOrderApi, uploadPaymentProofApi } from "@/lib/api/order.api";
import { fetchAndHydrate } from "@/lib/utils/hydrate-stores";
import { usePaymentContent } from "@/lib/hooks/use-payment-content";
import {
  FREE_SHIPPING_MINOR,
  formatMoney,
  shippingCostMinor,
  type Address,
  type PlacedOrder,
  type ShippingMethod,
} from "@ecommerce/contracts";

// Whole rupees read better in labels ("Rs 250", not "Rs 250.00").
const money = (minor: number) => formatMoney(minor / 100).replace(/\.00$/, "");
const cost = (method: ShippingMethod) => money(shippingCostMinor(method, 0));

const SHIPPING_METHODS: {
  id: ShippingMethod;
  label: string;
  detail: string;
  price: string;
}[] = [
  {
    id: "standard",
    label: "Standard Delivery",
    detail: "3–5 business days",
    price: `Free over ${money(FREE_SHIPPING_MINOR)}, else ${cost("standard")}`,
  },
  {
    id: "express",
    label: "Express Delivery",
    detail: "1–2 business days",
    price: cost("express"),
  },
  {
    id: "next-day",
    label: "Next Day Delivery",
    detail: "Order before 2 pm",
    price: cost("next-day"),
  },
];

const EMPTY_ADDRESS: Address = {
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  postcode: "",
  country: "Pakistan",
};

export function CheckoutForm() {
  const { cart } = useCart();
  const qc = useQueryClient();
  const user = useAuthStore((st) => st.user);
  const { data: pay } = usePaymentContent();
  // Stock may have changed since the items were added — re-check live stock.
  useEffect(() => {
    if (user) fetchAndHydrate().catch(() => {});
  }, [user]);
  const hasUnavailable = cart.items.some(
    (i) => i.availableStock !== undefined && i.availableStock < i.quantity,
  );
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("standard");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  // One key per checkout attempt: a double-click or retry returns the same order.
  const idempotencyKey = useRef(crypto.randomUUID());
  // Reuse the upload if the order call fails and the shopper retries.
  const uploaded = useRef<{ file: File; url: string } | null>(null);

  function setAddr(key: keyof Address) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setAddress((p) => ({ ...p, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!user) {
      setError("Please sign in to place your order.");
      return;
    }
    if (
      !email ||
      !address.firstName ||
      !address.lastName ||
      !address.line1 ||
      !address.city ||
      !address.postcode
    ) {
      setError("Please complete all required fields.");
      return;
    }
    if (!proof) {
      setError("Please upload your JazzCash payment screenshot.");
      return;
    }
    setLoading(true);
    try {
      if (uploaded.current?.file !== proof) {
        const { url } = await uploadPaymentProofApi(proof);
        uploaded.current = { file: proof, url };
      }
      const order = await placeOrderApi({
        idempotencyKey: idempotencyKey.current,
        contactEmail: email,
        contactPhone: phone || undefined,
        shippingAddress: { ...address, line2: address.line2 || undefined },
        shippingMethod,
        paymentScreenshotUrl: uploaded.current.url,
      });
      // The API already emptied the server cart; just reset the local copy.
      useCartStore.getState().replaceItems([]);
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
      setPlaced(order);
    } catch (err) {
      const res = (
        err as { response?: { status?: number; data?: { message?: string } } }
      ).response;
      if (res?.status === 409) {
        // Someone else bought an item first — refresh so the cart shows "Sold out".
        fetchAndHydrate().catch(() => {});
        setError(
          "Some items in your cart just sold out. Please review your cart.",
        );
      } else {
        setError(
          res?.data?.message ?? "Could not place your order. Try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (placed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center py-16 bg-surface border border-line"
      >
        <CheckCircle2
          size={48}
          className="text-accent mx-auto mb-4"
          strokeWidth={1.5}
        />
        <h2 className="text-lg font-bold text-foreground uppercase tracking-widest mb-2">
          Payment Received!
        </h2>
        <p className="text-[13px] text-secondary mb-2 px-4">
          Thank you — order <strong>#{placed.id.slice(-8)}</strong> is placed.
          We are verifying your JazzCash payment and will email you once your
          order is accepted.
        </p>
        <p className="text-[13px] text-secondary mb-2 px-4">
          You can follow this order any time under{" "}
          <Link
            href="/account?tab=orders"
            className="text-accent font-semibold no-underline"
          >
            My Account → Order History
          </Link>
          .
        </p>
        <p className="text-[13px] text-secondary mb-6">
          {pay && (
            <>
              Questions? Call us on{" "}
              <strong className="text-foreground">{pay.supportPhone}</strong>.
            </>
          )}
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center h-11 px-8 bg-foreground text-white text-[11px] font-bold tracking-[2px] uppercase no-underline hover:bg-accent transition-colors"
        >
          Continue Shopping
        </Link>
      </motion.div>
    );
  }

  const inputCls =
    "w-full border border-line bg-white px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-accent transition-colors";
  const labelCls =
    "text-[11px] font-bold uppercase tracking-widest text-foreground block mb-1.5";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Left — form sections */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                role="alert"
                className="text-accent text-[13px] bg-accent/10 px-4 py-3 border border-accent/20"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* 1. Customer Information */}
          <section className="border border-line">
            <div className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-line">
              <span className="w-6 h-6 rounded-full bg-foreground text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-foreground">
                Contact Information
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="co-email" className={labelCls}>
                  Email Address *
                </label>
                <input
                  id="co-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="co-phone" className={labelCls}>
                  Phone
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                  placeholder="+1 (800) 000 0000"
                />
              </div>
            </div>
          </section>

          {/* 2. Shipping Address */}
          <section className="border border-line">
            <div className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-line">
              <span className="w-6 h-6 rounded-full bg-foreground text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-foreground">
                Shipping Address
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sa-first" className={labelCls}>
                    First Name *
                  </label>
                  <input
                    id="sa-first"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={address.firstName}
                    onChange={setAddr("firstName")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="sa-last" className={labelCls}>
                    Last Name *
                  </label>
                  <input
                    id="sa-last"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={address.lastName}
                    onChange={setAddr("lastName")}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="sa-line1" className={labelCls}>
                  Address Line 1 *
                </label>
                <input
                  id="sa-line1"
                  type="text"
                  autoComplete="address-line1"
                  required
                  value={address.line1}
                  onChange={setAddr("line1")}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="sa-line2" className={labelCls}>
                  Address Line 2
                </label>
                <input
                  id="sa-line2"
                  type="text"
                  autoComplete="address-line2"
                  value={address.line2 ?? ""}
                  onChange={setAddr("line2")}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label htmlFor="sa-postcode" className={labelCls}>
                    Postcode *
                  </label>
                  <input
                    id="sa-postcode"
                    type="text"
                    autoComplete="postal-code"
                    required
                    value={address.postcode}
                    onChange={setAddr("postcode")}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor="sa-city" className={labelCls}>
                    City *
                  </label>
                  <input
                    id="sa-city"
                    type="text"
                    autoComplete="address-level2"
                    required
                    value={address.city}
                    onChange={setAddr("city")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="sa-country" className={labelCls}>
                    Country *
                  </label>
                  <select
                    id="sa-country"
                    autoComplete="country-name"
                    value={address.country}
                    disabled
                    className={`${inputCls} cursor-not-allowed opacity-70`}
                  >
                    <option>Pakistan</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Shipping Method */}
          <section className="border border-line">
            <div className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-line">
              <span className="w-6 h-6 rounded-full bg-foreground text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-foreground">
                <Truck size={13} className="inline mr-1.5 mb-0.5" />
                Delivery Method
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {SHIPPING_METHODS.map((m) => (
                <label
                  key={m.id}
                  htmlFor={`ship-${m.id}`}
                  className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${shippingMethod === m.id ? "border-accent bg-accent/5" : "border-line hover:border-accent/50"}`}
                >
                  <input
                    id={`ship-${m.id}`}
                    type="radio"
                    name="shipping"
                    value={m.id}
                    checked={shippingMethod === m.id}
                    onChange={() => setShippingMethod(m.id)}
                    className="mt-0.5 accent-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-foreground">
                      {m.label}
                    </p>
                    <p className="text-[11px] text-secondary mt-0.5">
                      {m.detail}
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-foreground shrink-0">
                    {m.price}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* 4. Payment — JazzCash QR + screenshot */}
          <section className="border border-line">
            <div className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-line">
              <span className="w-6 h-6 rounded-full bg-foreground text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-foreground">
                <CreditCard size={13} className="inline mr-1.5 mb-0.5" />
                Pay with JazzCash
              </h2>
            </div>
            <JazzCashPayment
              file={proof}
              onFileChange={setProof}
              labelCls={labelCls}
            />
          </section>

          <button
            type="submit"
            disabled={
              loading ||
              cart.items.length === 0 ||
              hasUnavailable ||
              !user ||
              !pay?.accountNumber
            }
            className="w-full h-12 bg-accent text-white border-none text-[12px] font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Placing Order…" : "Place Order"}
          </button>
          {hasUnavailable && (
            <p role="alert" className="text-[12px] text-accent text-center">
              Some items are sold out or low on stock.{" "}
              <Link href="/cart" className="underline">
                Review your cart
              </Link>
            </p>
          )}
          {!user && (
            <p className="text-[12px] text-secondary text-center">
              Please{" "}
              <Link
                href="/login?next=/checkout"
                className="text-accent no-underline"
              >
                sign in
              </Link>{" "}
              or{" "}
              <Link
                href="/signup?next=/checkout"
                className="text-accent no-underline"
              >
                create an account
              </Link>{" "}
              to place your order — your cart will be kept.
            </p>
          )}
        </div>

        {/* Right — summary */}
        <div className="w-full xl:w-80 shrink-0 xl:sticky xl:top-24">
          <CheckoutOrderSummary cart={cart} shippingMethod={shippingMethod} />
        </div>
      </div>
    </form>
  );
}
