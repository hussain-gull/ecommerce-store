import type {
  ContactMessage,
  ContactMessageCounts,
  ContactMessagesQuery,
  PaginationMeta,
  ContactMessagePayload,
} from "@ecommerce/contracts";
import { or } from "@prisma/orm-postgres/orm-client";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { uuidv7 } from "../utils/uuid.util.js";
import { createHttpError } from "../utils/response.util.js";

// ── mapper ────────────────────────────────────────────────────────────────────

function rowToContactMessage(row: {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status === "read" ? "read" : "new",
    createdAt: row.created_at,
  };
}

// ── service functions ─────────────────────────────────────────────────────────

export async function sendContactMessageService(
  payload: ContactMessagePayload,
): Promise<void> {
  await db.orm.public.contact_messages.create({
    id: uuidv7(),
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
    status: "new",
    created_at: nowUtc() as any,
  });
}

const likeEscape = (v: string) => v.replace(/[\\%_]/g, "\\$&");

export async function listContactMessagesService(
  query: ContactMessagesQuery,
): Promise<{ messages: ContactMessage[]; meta: PaginationMeta }> {
  let c = db.orm.public.contact_messages.where((m) => m.id.isNotNull());
  if (query.status) c = c.where({ status: query.status });
  if (query.from) c = c.where((m) => m.created_at.gte(query.from!));
  if (query.to) c = c.where((m) => m.created_at.lt(query.to!));
  if (query.q) {
    const like = `%${likeEscape(query.q)}%`;
    c = c.where((m) =>
      or(
        m.name.ilike(like),
        m.email.ilike(like),
        m.phone.ilike(like),
        m.subject.ilike(like),
        m.message.ilike(like),
      ),
    );
  }
  const { n: total } = await c.aggregate((a) => ({ n: a.count() }));
  const rows = await c
    .orderBy((m) => m.created_at.desc())
    .limit(query.limit)
    .offset((query.page - 1) * query.limit)
    .all();
  return {
    messages: rows.map(rowToContactMessage),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function contactMessageCountsService(): Promise<ContactMessageCounts> {
  const rows = await db.orm.public.contact_messages
    .groupBy("status")
    .aggregate((a) => ({ n: a.count() }));
  const n = (s: string) => rows.find((r) => r.status === s)?.n ?? 0;
  return { all: n("new") + n("read"), new: n("new"), read: n("read") };
}

export async function markContactMessageReadService(
  id: string,
): Promise<ContactMessage> {
  const existing = await db.orm.public.contact_messages.where({ id }).first();

  if (!existing) {
    throw createHttpError(404, "Message not found.");
  }

  await db.orm.public.contact_messages.where({ id }).update({ status: "read" });

  return rowToContactMessage({ ...existing, status: "read" });
}
