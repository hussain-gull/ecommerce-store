"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatMoney, type CartItem } from "@ecommerce/contracts";

type CartLineItemProps = {
  item: CartItem;
  onRemove: (productId: string, size?: string, color?: string) => void;
  onQuantityChange: (
    productId: string,
    quantity: number,
    size?: string,
    color?: string,
  ) => void;
};

function parsePrice(price: string): number {
  return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
}

export function CartLineItem({
  item,
  onRemove,
  onQuantityChange,
}: CartLineItemProps) {
  const unitPrice = parsePrice(item.product.price);
  const subtotal = formatMoney(unitPrice * item.quantity);
  const stock = item.availableStock;
  const soldOut = stock === 0;
  const lowStock = stock !== undefined && stock > 0 && stock < item.quantity;

  return (
    <div
      className={`flex gap-4 py-5 border-b border-line last:border-b-0 ${soldOut ? "opacity-60" : ""}`}
    >
      {/* Thumbnail */}
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-wash">
          <Image
            src={item.product.img}
            alt={item.product.name}
            fill
            sizes="96px"
            className="object-contain p-1.5"
            unoptimized
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 min-w-0 gap-4 flex-col sm:flex-row sm:items-start">
        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${item.product.slug}`}
            className="no-underline"
          >
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors mb-1">
              {item.product.name}
            </h3>
          </Link>
          {item.size && (
            <p className="text-[11px] text-secondary mb-0.5">
              Size: <span className="text-foreground">{item.size}</span>
            </p>
          )}
          {item.color && (
            <p className="text-[11px] text-secondary mb-0.5">
              Color: <span className="text-foreground">{item.color}</span>
            </p>
          )}
          <p className="text-[13px] font-semibold text-foreground mt-1.5">
            {item.product.price}
          </p>
          {soldOut && (
            <p className="mt-1.5 text-[11px] font-bold uppercase tracking-widest text-accent">
              Sold out
            </p>
          )}
          {lowStock && (
            <p className="mt-1.5 text-[11px] font-bold text-accent">
              Only {stock} left — reduce quantity to continue
            </p>
          )}
        </div>

        {/* Quantity + subtotal + remove */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex border border-line h-9">
            <button
              onClick={() =>
                onQuantityChange(
                  item.product.id,
                  Math.max(1, item.quantity - 1),
                  item.size,
                  item.color,
                )
              }
              aria-label="Decrease quantity"
              className="w-8 bg-transparent border-none text-base cursor-pointer text-foreground hover:text-accent transition-colors"
            >
              −
            </button>
            <span
              className="w-9 flex items-center justify-center text-[13px] font-semibold text-foreground"
              aria-live="polite"
              aria-label={`Quantity: ${item.quantity}`}
            >
              {item.quantity}
            </span>
            <button
              onClick={() =>
                onQuantityChange(
                  item.product.id,
                  item.quantity + 1,
                  item.size,
                  item.color,
                )
              }
              aria-label="Increase quantity"
              disabled={stock !== undefined && item.quantity >= stock}
              className="w-8 bg-transparent border-none text-base cursor-pointer text-foreground hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>

          <div className="text-[13px] font-bold text-foreground w-16 text-right hidden sm:block">
            {subtotal}
          </div>

          <button
            onClick={() => onRemove(item.product.id, item.size, item.color)}
            aria-label={`Remove ${item.product.name}`}
            className="bg-transparent border-none cursor-pointer text-muted hover:text-accent transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
