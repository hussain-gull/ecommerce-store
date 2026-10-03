#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0529aa208a7314a6b00170a03fb7c6c3e2915a181d890675e4fce33a7e69a364/contract';
import endContract from '../../snapshots/0529aa208a7314a6b00170a03fb7c6c3e2915a181d890675e4fce33a7e69a364/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cb3bbbe410ad0489564d3abc9c6f56462e29d1eaf4db6ca0fb6e52b5c236c6a8/contract';
import startContract from '../../snapshots/cb3bbbe410ad0489564d3abc9c6f56462e29d1eaf4db6ca0fb6e52b5c236c6a8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'order_events',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('order_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('customer_name', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_events',
        index: 'order_events_order_id_idx_39ad19ad',
        columns: ['order_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_events',
        foreignKey: {
          name: 'order_events_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
        },
      }),
      // Existing orders: copy the display name, and seed a history from what we know
      // (placement time for "pending"; the current status is stamped at placement
      // too, since earlier transitions weren't recorded).
      rawSql({
        id: 'data_migration.orders-customer-name-and-events-backfill',
        label: 'Data transform: backfill orders.customer_name and order_events',
        operationClass: 'data',
        target: { id: 'postgres' },
        precheck: [],
        execute: [
          {
            description: 'Backfill orders.customer_name',
            sql: `UPDATE "public"."orders" SET "customer_name" = concat_ws(' ', "ship_address"->>'firstName', "ship_address"->>'lastName')`,
            params: [],
          },
          {
            description: 'Seed order_events with the placement event',
            sql: `INSERT INTO "public"."order_events" ("id", "order_id", "status", "created_at") SELECT gen_random_uuid()::text, "id", 'pending', "created_at" FROM "public"."orders"`,
            params: [],
          },
          {
            description: 'Seed order_events with the current status when it moved on',
            sql: `INSERT INTO "public"."order_events" ("id", "order_id", "status", "created_at") SELECT gen_random_uuid()::text, "id", "status", "created_at" + interval '1 second' FROM "public"."orders" WHERE "status" <> 'pending'`,
            params: [],
          },
        ],
        postcheck: [],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
