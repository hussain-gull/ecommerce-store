// ─── Contact message types ──────────────────────────────────────────────────

export type ContactMessagePayload = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

// ─── Admin inbox types ──────────────────────────────────────────────────────

export type ContactMessageStatus = "new" | "read";

export type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string; // ISO-8601 UTC
};

/** Messages per status — stat cards, tab badges and the sidebar's unread badge. */
export type ContactMessageCounts = { all: number; new: number; read: number };
