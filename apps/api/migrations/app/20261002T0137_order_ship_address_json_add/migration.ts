#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3e77fe58f0785bc2ed39118cba2d162429b9ba678fb9b90906e7a6257308bcfb/contract';
import endContract from '../../snapshots/3e77fe58f0785bc2ed39118cba2d162429b9ba678fb9b90906e7a6257308bcfb/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/eb3e5ae55d6fccd40ce424091ba4424b5a7b4a554513953a461d25812dac0935/contract';
import startContract from '../../snapshots/eb3e5ae55d6fccd40ce424091ba4424b5a7b4a554513953a461d25812dac0935/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('ship_address', 'json', { codecRef: { codecId: 'pg/json@1' } }),
      }),
      // Copy every existing order's flat ship_* columns into the JSON snapshot
      // (line2 is omitted when empty, matching the shared Address shape).
      rawSql({
        id: 'data_migration.orders-ship-address-backfill',
        label: 'Data transform: backfill orders.ship_address from ship_* columns',
        operationClass: 'data',
        target: { id: 'postgres' },
        precheck: [],
        execute: [
          {
            description: 'Backfill orders.ship_address',
            sql: `UPDATE "public"."orders" SET "ship_address" = jsonb_strip_nulls(jsonb_build_object('firstName', "ship_first_name", 'lastName', "ship_last_name", 'line1', "ship_line1", 'line2', NULLIF("ship_line2", ''), 'city', "ship_city", 'postcode', "ship_postcode", 'country', "ship_country"))::json WHERE "ship_address" IS NULL`,
            params: [],
          },
        ],
        postcheck: [
          {
            description: 'Every order now has ship_address',
            sql: `SELECT NOT EXISTS (SELECT 1 FROM "public"."orders" WHERE "ship_address" IS NULL) AS ok`,
            params: [],
          },
        ],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
