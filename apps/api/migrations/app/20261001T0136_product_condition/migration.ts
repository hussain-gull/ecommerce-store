#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/617852e7ff3fc2d7236dcfd782ffc28724d72d7ce9464a2466a4e6daa01805c7/contract';
import endContract from '../../snapshots/617852e7ff3fc2d7236dcfd782ffc28724d72d7ce9464a2466a4e6daa01805c7/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c568ff6c4ab83cdf236b9a40d564a26e91884c1a52ed0f56cf3eb718825c713c/contract';
import startContract from '../../snapshots/c568ff6c4ab83cdf236b9a40d564a26e91884c1a52ed0f56cf3eb718825c713c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'products',
        column: col('condition_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'products',
        index: 'products_condition_id_idx_596457aa',
        columns: ['condition_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'products',
        foreignKey: {
          name: 'products_condition_id_fkey',
          columns: ['condition_id'],
          references: { schema: 'public', table: 'filter_options', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
