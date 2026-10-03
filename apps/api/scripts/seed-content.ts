// Populates the `site_content` table (home, about, contact, blog, condition-guide
// page copy) from the JSON files in scripts/seed-data/.
//
// Usage:
//   pnpm run seed:content            # insert pages that don't exist yet; never touches
//                                    # pages an admin has already saved
//   pnpm run seed:content -- --force # overwrite every page with the seed data
//
// Safe to re-run (and to run on every deploy) — without --force it only fills gaps,
// so admin edits are never lost. Every file is validated against its Zod schema
// (the same one the admin PUT endpoints use) BEFORE anything is written, so a bad
// file aborts the whole run with nothing half-seeded.
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ZodType } from "zod";
import {
  homeContentSchema,
  aboutUsContentSchema,
  contactUsContentSchema,
  blogContentSchema,
  conditionGuideContentSchema,
  branding,
} from "@ecommerce/contracts";
import { nowUtc } from "../src/utils/datetime.util.js";
import { db } from "../src/prisma/db";

const PAGES: { key: string; file: string; schema: ZodType }[] = [
  { key: "home", file: "home-content.json", schema: homeContentSchema },
  { key: "about", file: "about-content.json", schema: aboutUsContentSchema },
  {
    key: "contact",
    file: "contact-content.json",
    schema: contactUsContentSchema,
  },
  { key: "blog", file: "blog-content.json", schema: blogContentSchema },
  {
    key: "condition-guide",
    file: "condition-guide-content.json",
    schema: conditionGuideContentSchema,
  },
];

const DEFAULT_DIR = fileURLToPath(new URL("./seed-data/", import.meta.url));

export type SeedResult = {
  key: string;
  action: "created" | "overwritten" | "skipped";
};

export async function seedContent(
  opts: { force?: boolean; dir?: string } = {},
): Promise<SeedResult[]> {
  const dir = opts.dir ?? DEFAULT_DIR;

  // 1. Read + validate everything first.
  const loaded: { key: string; data: unknown }[] = [];
  const problems: string[] = [];
  for (const { key, file, schema } of PAGES) {
    let raw: unknown;
    try {
      // {{storeName}} / {{shortName}} in the seed files come from branding.json.
      raw = JSON.parse(
        (await readFile(`${dir}/${file}`, "utf-8"))
          .replaceAll("{{storeName}}", branding.storeName)
          .replaceAll("{{shortName}}", branding.shortName),
      );
    } catch (err) {
      problems.push(`${file}: cannot read/parse (${(err as Error).message})`);
      continue;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push(
          `${file}: ${issue.path.join(".") || "(root)"} — ${issue.message}`,
        );
      }
      continue;
    }
    loaded.push({ key, data: parsed.data });
  }
  if (problems.length > 0) {
    throw new Error(
      `Seed data is invalid, nothing was written:\n  ${problems.join("\n  ")}`,
    );
  }

  // 2. Write.
  const results: SeedResult[] = [];
  for (const { key, data } of loaded) {
    const existing = await db.orm.public.site_content
      .select("key")
      .where({ key })
      .first();
    if (existing && !opts.force) {
      results.push({ key, action: "skipped" });
      continue;
    }
    const updated_at = nowUtc() as any;
    await db.orm.public.site_content.upsert({
      create: { key, data: data as any, updated_at },
      update: { data: data as any, updated_at },
    });
    results.push({ key, action: existing ? "overwritten" : "created" });
  }
  return results;
}

// Only run when executed directly (`tsx scripts/seed-content.ts`), not when the
// integration tests import seedContent.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  seedContent({ force: process.argv.includes("--force") })
    .then((results) => {
      for (const r of results) console.log(`${r.action.padEnd(11)} ${r.key}`);
      const skipped = results.filter((r) => r.action === "skipped").length;
      if (skipped > 0) {
        console.log(
          `\n${skipped} page(s) already exist and were left untouched. Use --force to overwrite them.`,
        );
      }
    })
    .catch((err: unknown) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    })
    .finally(() => process.exit());
}
