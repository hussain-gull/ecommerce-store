#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/53a7f4ede025d04c418c9122920e49ceede5c2c0ec35d8288e1193cd292296e8/contract';
import endContract from '../../snapshots/53a7f4ede025d04c418c9122920e49ceede5c2c0ec35d8288e1193cd292296e8/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c0a81f5ea12f7203a3915743cce241049dc05353d4b84409012ad22924eac50d/contract';
import startContract from '../../snapshots/c0a81f5ea12f7203a3915743cce241049dc05353d4b84409012ad22924eac50d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('contact_email', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('contact_phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('idempotency_key', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('payment_screenshot_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('payment_submitted_at', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('ship_city', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('ship_country', 'text', {
          notNull: true,
          default: lit('Pakistan'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('ship_first_name', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('ship_last_name', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('ship_line1', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('ship_line2', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('ship_postcode', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('shipping_cost', 'numeric', {
          notNull: true,
          default: lit('0'),
          codecRef: { codecId: 'pg/numeric@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('shipping_method', 'text', {
          notNull: true,
          default: lit('standard'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_user_idempotency_key_7e79ccf4',
        columns: ['user_id', 'idempotency_key'],
        extras: { unique: true },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
