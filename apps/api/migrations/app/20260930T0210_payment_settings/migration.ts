#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/53a7f4ede025d04c418c9122920e49ceede5c2c0ec35d8288e1193cd292296e8/contract';
import startContract from '../../snapshots/53a7f4ede025d04c418c9122920e49ceede5c2c0ec35d8288e1193cd292296e8/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e93870eb8fea3cf2cd63d19ebabf421ad3d625788c5dbf30bf7b2f9c8deb050d/contract';
import endContract from '../../snapshots/e93870eb8fea3cf2cd63d19ebabf421ad3d625788c5dbf30bf7b2f9c8deb050d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'payment_settings',
        columns: [
          col('account_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('account_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('qr_image', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('support_phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
