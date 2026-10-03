import type { SavedAddress, CreateAddressPayload } from "@ecommerce/contracts";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { createHttpError } from "../utils/response.util.js";

// ── mapper ────────────────────────────────────────────────────────────────────

function rowToSavedAddress(row: {
  id: string;
  user_id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
  country: string;
  created_at: string;
}): SavedAddress {
  return {
    id: row.id,
    userId: row.user_id,
    ...(row.label ? { label: row.label } : {}),
    firstName: row.first_name,
    lastName: row.last_name,
    line1: row.line1,
    ...(row.line2 ? { line2: row.line2 } : {}),
    city: row.city,
    postcode: row.postcode,
    country: row.country,
    createdAt: row.created_at,
  };
}

// ── service functions ─────────────────────────────────────────────────────────

export async function listAddressesService(
  userId: string,
): Promise<SavedAddress[]> {
  const rows = await db.orm.public.addresses
    .where({ user_id: userId })
    .orderBy((a) => a.created_at.desc())
    .all();
  return rows.map(rowToSavedAddress);
}

export async function createAddressService(
  userId: string,
  payload: CreateAddressPayload,
): Promise<SavedAddress> {
  const row = await db.orm.public.addresses.create({
    id: crypto.randomUUID(),
    user_id: userId,
    label: payload.label ?? null,
    first_name: payload.firstName,
    last_name: payload.lastName,
    line1: payload.line1,
    line2: payload.line2 ?? null,
    city: payload.city,
    postcode: payload.postcode,
    country: payload.country,
    created_at: nowUtc() as any,
  });
  return rowToSavedAddress(row);
}

export async function deleteAddressService(
  userId: string,
  addressId: string,
): Promise<void> {
  const existing = await db.orm.public.addresses
    .select("id", "user_id")
    .where({ id: addressId })
    .first();

  if (!existing) {
    throw createHttpError(404, "Address not found.");
  }

  // Prevent users from deleting other users' addresses.
  if (existing.user_id !== userId) {
    throw createHttpError(403, "Forbidden.");
  }

  await db.orm.public.addresses.where({ id: addressId }).delete();
}
