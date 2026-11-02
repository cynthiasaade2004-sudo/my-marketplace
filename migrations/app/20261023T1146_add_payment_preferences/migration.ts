#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/588164975b5b4a41d9190cf870f75329a2479810073cfa00ade7f1204f91a690/contract';
import startContract from '../../snapshots/588164975b5b4a41d9190cf870f75329a2479810073cfa00ade7f1204f91a690/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cb5071ffe246c1c4dde3b7096f11c8e8ed2eb6acbdc338b1c88da2d3f07efb22/contract';
import endContract from '../../snapshots/cb5071ffe246c1c4dde3b7096f11c8e8ed2eb6acbdc338b1c88da2d3f07efb22/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Order',
        column: col('paymentMethod', 'text', {
          notNull: true,
          default: lit('CARD'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('preferredPaymentMethod', 'text', {
          notNull: true,
          default: lit('CARD'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Order',
        constraint: 'Order_paymentMethod_check_e153553a',
        expression: sql`"paymentMethod" IN ('CASH', 'CARD')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'User',
        constraint: 'User_preferredPaymentMethod_check_63f87313',
        expression: sql`"preferredPaymentMethod" IN ('CASH', 'CARD')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
