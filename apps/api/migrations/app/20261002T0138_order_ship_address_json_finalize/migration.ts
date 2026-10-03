#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3e77fe58f0785bc2ed39118cba2d162429b9ba678fb9b90906e7a6257308bcfb/contract';
import startContract from '../../snapshots/3e77fe58f0785bc2ed39118cba2d162429b9ba678fb9b90906e7a6257308bcfb/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cb3bbbe410ad0489564d3abc9c6f56462e29d1eaf4db6ca0fb6e52b5c236c6a8/contract';
import endContract from '../../snapshots/cb3bbbe410ad0489564d3abc9c6f56462e29d1eaf4db6ca0fb6e52b5c236c6a8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      // Fails (rolling back the whole run) if any order missed the backfill — never drops data it hasn't copied.
      this.setNotNull({ schema: 'public', table: 'orders', column: 'ship_address' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'ship_city' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'ship_country' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'ship_first_name' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'ship_last_name' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'ship_line1' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'ship_line2' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'ship_postcode' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
