import type {
  DbCartItem,
  DbWishlistItem,
  CartItem,
  WishlistItem,
  Product,
} from "@ecommerce/contracts";
import { getProductsApi } from "@/lib/api/product.api";
import { mergeCartApi } from "@/lib/api/cart.api";
import { mergeWishlistApi } from "@/lib/api/wishlist.api";
import { getCartApi } from "@/lib/api/cart.api";
import { getWishlistApi } from "@/lib/api/wishlist.api";
import { useCartStore } from "@/lib/store/cart.store";
import { useWishlistStore } from "@/lib/store/wishlist.store";

function dbCartToLocal(
  items: DbCartItem[],
  productsMap: Map<string, Product>,
): CartItem[] {
  const result: CartItem[] = [];
  for (const item of items) {
    const product = productsMap.get(item.productId);
    if (!product) continue;
    const entry: CartItem = { product, quantity: item.quantity };
    if (item.size) entry.size = item.size;
    if (item.color) entry.color = item.color;
    if (item.availableStock !== undefined)
      entry.availableStock = item.availableStock;
    result.push(entry);
  }
  return result;
}

function dbWishlistToLocal(
  items: DbWishlistItem[],
  productsMap: Map<string, Product>,
): WishlistItem[] {
  const result: WishlistItem[] = [];
  for (const item of items) {
    const product = productsMap.get(item.productId);
    if (!product) continue;
    result.push({ product, addedAt: item.addedAt });
  }
  return result;
}

/**
 * Called after login/signup: merges guest-local items into the DB,
 * then replaces the local store with the authoritative server state.
 */
export async function mergeAndHydrate(): Promise<void> {
  const guestCart = useCartStore.getState().items;
  const guestWishlist = useWishlistStore.getState().items;

  const [mergedCart, mergedWishlist, products] = await Promise.all([
    mergeCartApi({
      items: guestCart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      })),
    }),
    mergeWishlistApi({
      items: guestWishlist.map((i) => ({ productId: i.product.id })),
    }),
    getProductsApi(),
  ]);
  const productsMap = new Map(products.map((p) => [p.id, p]));

  useCartStore.getState().replaceItems(dbCartToLocal(mergedCart, productsMap));
  useWishlistStore
    .getState()
    .replaceItems(dbWishlistToLocal(mergedWishlist, productsMap));
}

/**
 * Called on app start when the user is already authenticated (page refresh).
 * Fetches current DB state and replaces local stores — no merge, just sync.
 */
export async function fetchAndHydrate(): Promise<void> {
  const [cartItems, wishlistItems, products] = await Promise.all([
    getCartApi(),
    getWishlistApi(),
    getProductsApi(),
  ]);
  const productsMap = new Map(products.map((p) => [p.id, p]));

  useCartStore.getState().replaceItems(dbCartToLocal(cartItems, productsMap));
  useWishlistStore
    .getState()
    .replaceItems(dbWishlistToLocal(wishlistItems, productsMap));
}
