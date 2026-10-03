#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/617852e7ff3fc2d7236dcfd782ffc28724d72d7ce9464a2466a4e6daa01805c7/contract';
import startContract from '../../snapshots/617852e7ff3fc2d7236dcfd782ffc28724d72d7ce9464a2466a4e6daa01805c7/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a11fafffaccb4b81189797671116a3a2cd3d59e9f383f702a2c290c4e63247f5/contract';
import endContract from '../../snapshots/a11fafffaccb4b81189797671116a3a2cd3d59e9f383f702a2c290c4e63247f5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'filter_options',
        column: col('hex', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
