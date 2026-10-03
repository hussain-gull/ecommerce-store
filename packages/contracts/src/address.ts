// ─── Address types ─────────────────────────────────────────────────────────────

export type Address = {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
};

export type SavedAddress = Address & {
  id: string;
  userId: string;
  label?: string;
  createdAt: string; // ISO-8601 UTC
};

export type CreateAddressPayload = Address & { label?: string };
