// Creates or resets the admin panel user from ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD in .env.
//
// Usage:
//   pnpm run seed:admin
//
// To change credentials (or recover access after a suspected compromise):
//   1. Edit ADMIN_EMAIL / ADMIN_PASSWORD (and optionally ADMIN_NAME) in apps/api/.env
//   2. Re-run `pnpm run seed:admin` — it upserts by email, so re-running is always safe.
import bcrypt from "bcryptjs";
import { config } from "../src/config.js";
import { db } from "../src/prisma/db";
import { nowUtc } from "../src/utils/datetime.util";

async function main(): Promise<void> {
  const name = process.env.ADMIN_NAME ?? "Admin";
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) throw new Error("ADMIN_EMAIL is not set in .env");
  if (!password || password.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD must be set in .env and at least 8 characters long",
    );
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);
  const existing = await db.orm.public.admin_users.where({ email }).first();

  if (existing) {
    await db.orm.public.admin_users.where({ email }).update({
      name,
      password_hash: passwordHash,
      updated_at: nowUtc() as any,
    });
    console.log(`Admin user reset: ${email}`);
  } else {
    await db.orm.public.admin_users.create({
      id: crypto.randomUUID(),
      name,
      email,
      password_hash: passwordHash,
      created_at: nowUtc() as any,
      updated_at: nowUtc() as any,
    });
    console.log(`Admin user created: ${email}`);
  }
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
