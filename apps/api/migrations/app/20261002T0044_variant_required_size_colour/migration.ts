#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a11fafffaccb4b81189797671116a3a2cd3d59e9f383f702a2c290c4e63247f5/contract';
import startContract from '../../snapshots/a11fafffaccb4b81189797671116a3a2cd3d59e9f383f702a2c290c4e63247f5/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/eb3e5ae55d6fccd40ce424091ba4424b5a7b4a554513953a461d25812dac0935/contract';
import endContract from '../../snapshots/eb3e5ae55d6fccd40ce424091ba4424b5a7b4a554513953a461d25812dac0935/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

// Legacy rows missing a value get a neutral default so NOT NULL can apply.
const DEFAULTS = { color_hex: '#000000', color_name: 'Black', size: 'One size' } as const;

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dataTransform(contract, 'handle-nulls-product_variants-color_hex', {
        check: () =>
          db.public.product_variants
            .select('id')
            .where((f, fns) => fns.eq(f.color_hex, null))
            .limit(1),
        run: () =>
          db.public.product_variants
            .update({ color_hex: DEFAULTS.color_hex })
            .where((f, fns) => fns.eq(f.color_hex, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'product_variants', column: 'color_hex' }),
      this.dataTransform(contract, 'handle-nulls-product_variants-color_name', {
        check: () =>
          db.public.product_variants
            .select('id')
            .where((f, fns) => fns.eq(f.color_name, null))
            .limit(1),
        run: () =>
          db.public.product_variants
            .update({ color_name: DEFAULTS.color_name })
            .where((f, fns) => fns.eq(f.color_name, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'product_variants', column: 'color_name' }),
      this.dataTransform(contract, 'handle-nulls-product_variants-size', {
        check: () =>
          db.public.product_variants
            .select('id')
            .where((f, fns) => fns.eq(f.size, null))
            .limit(1),
        run: () =>
          db.public.product_variants
            .update({ size: DEFAULTS.size })
            .where((f, fns) => fns.eq(f.size, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'product_variants', column: 'size' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
