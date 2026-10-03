// Page-content persistence tests against a REAL Postgres — see
// orders.integration.test.ts for how to run (TEST_DATABASE_URL, scratch DB only).
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

const url = process.env["TEST_DATABASE_URL"];
if (!url || !/test|scratch/i.test(new URL(url).pathname)) {
  throw new Error(
    "Set TEST_DATABASE_URL to a scratch database whose name contains 'test' or 'scratch'.",
  );
}
process.env["DATABASE_URL"] = url;
process.env["RESEND_API_KEY"] = "";

const { db } = await import("../src/prisma/db.js");
const content = await import("../src/services/content.service.js");
const { seedContent } = await import("../scripts/seed-content.js");

const KEYS = ["home", "about", "contact", "blog", "condition-guide"];

describe("site content", () => {
  after(async () => {
    await db.close?.();
  });

  it("an unseeded page is a 404; seeding fills gaps, never clobbers admin edits, --force does", async () => {
    await db.orm.public.site_content
      .where((r) => r.key.in(KEYS))
      .deleteAndCount();

    await assert.rejects(
      content.getContactContentService(),
      (e) => (e as { statusCode?: number }).statusCode === 404,
    );

    const first = await seedContent();
    assert.deepEqual(
      first.map((r) => r.action),
      KEYS.map(() => "created"),
    );
    const seeded = await content.getContactContentService();
    assert.ok(seeded.heading.length > 0);

    // an admin edit survives a re-seed
    await content.updateContactContentService({
      ...seeded,
      heading: "Admin edit",
    });
    const again = await seedContent();
    assert.ok(again.every((r) => r.action === "skipped"));
    assert.equal(
      (await content.getContactContentService()).heading,
      "Admin edit",
    );

    // --force restores the seed data
    await seedContent({ force: true });
    assert.equal(
      (await content.getContactContentService()).heading,
      seeded.heading,
    );
  });

  it("invalid seed data aborts before writing anything", async () => {
    await db.orm.public.site_content
      .where((r) => r.key.in(KEYS))
      .deleteAndCount();
    const { mkdtemp, cp, writeFile } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const dir = await mkdtemp(`${tmpdir()}/seed-`);
    await cp(new URL("../scripts/seed-data/", import.meta.url), dir, {
      recursive: true,
    });
    await writeFile(`${dir}/about-content.json`, "{}");

    await assert.rejects(seedContent({ dir }), /nothing was written/);
    const rows = await db.orm.public.site_content
      .where((r) => r.key.in(KEYS))
      .all();
    assert.equal(rows.length, 0);
  });

  it("a second save overwrites the first and concurrent saves both succeed", async () => {
    await seedContent(); // fill any gaps left by the previous test
    const base = await content.getContactContentService();
    await Promise.all([
      content.updateContactContentService({ ...base, heading: "A" }),
      content.updateContactContentService({ ...base, heading: "B" }),
    ]);
    assert.ok(
      ["A", "B"].includes((await content.getContactContentService()).heading),
    );
    const rows = await db.orm.public.site_content
      .where({ key: "contact" })
      .all();
    assert.equal(rows.length, 1);
  });

  it("payment details round-trip and start blank", async () => {
    await db.orm.public.payment_settings.where({ id: "default" }).delete();
    assert.equal((await content.getPaymentContentService()).accountNumber, "");
    await Promise.all([
      content.updatePaymentContentService({
        accountName: "X",
        accountNumber: "0300",
        supportPhone: "1",
        qrImage: "",
      }),
      content.updatePaymentContentService({
        accountName: "X",
        accountNumber: "0300",
        supportPhone: "1",
        qrImage: "",
      }),
    ]);
    assert.equal(
      (await content.getPaymentContentService()).accountNumber,
      "0300",
    );
  });
});
