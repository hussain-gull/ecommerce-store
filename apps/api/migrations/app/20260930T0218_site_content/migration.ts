#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c568ff6c4ab83cdf236b9a40d564a26e91884c1a52ed0f56cf3eb718825c713c/contract';
import endContract from '../../snapshots/c568ff6c4ab83cdf236b9a40d564a26e91884c1a52ed0f56cf3eb718825c713c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e93870eb8fea3cf2cd63d19ebabf421ad3d625788c5dbf30bf7b2f9c8deb050d/contract';
import startContract from '../../snapshots/e93870eb8fea3cf2cd63d19ebabf421ad3d625788c5dbf30bf7b2f9c8deb050d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'site_content',
        columns: [
          col('data', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['key'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
