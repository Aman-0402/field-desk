import { safe } from '../common/domain.js';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { crmCustomers } from '../customers/customers.model.js';
import { crmOrders } from '../orders/orders.model.js';

export const crmReceivableEntries = sqliteTable(
  'receivable_entries',
  {
    id: text('id').primaryKey(),
    customer_id: text('customer_id')
      .notNull()
      .references(() => crmCustomers.id, { onDelete: 'cascade' }),
    order_id: text('order_id')
      .notNull()
      .references(() => crmOrders.id, { onDelete: 'cascade' }),
    line_key: text('line_key'),
    shipment_line_id: text('shipment_line_id'),
    kind: text('kind').notNull(),
    amount_paise: integer('amount_paise').notNull(),
    adjusts_id: text('adjusts_id'),
    source_id: text('source_id').notNull(),
    action_id: text('action_id').notNull(),
    created_at: text('created_at').notNull(),
  },
  (t) => [
    index('receivable_entries_customer_id_idx').on(t.customer_id),
    index('receivable_entries_order_id_idx').on(t.order_id),
    check(
      'receivable_entries_amount_paise_check',
      sql`typeof(${t.amount_paise}) = 'integer'`,
    ),
  ],
);

export const crmPaymentReceipts = sqliteTable(
  'payment_receipts',
  {
    id: text('id').primaryKey(),
    customer_id: text('customer_id')
      .notNull()
      .references(() => crmCustomers.id, { onDelete: 'cascade' }),
    amount_paise: integer('amount_paise').notNull(),
    reference: text('reference').notNull(),
    /** The reversed receipt this one replaces after a move (ACC-004). */
    moved_from_receipt_id: text('moved_from_receipt_id'),
    action_id: text('action_id').notNull(),
    created_at: text('created_at').notNull(),
  },
  (t) => [
    index('payment_receipts_customer_id_idx').on(t.customer_id),
    check(
      'payment_receipts_amount_paise_check',
      sql`typeof(${t.amount_paise}) = 'integer' and ${t.amount_paise} > 0`,
    ),
  ],
);

/** A receipt recorded against the wrong customer, reversed by a move (ACC-004). */
export const crmReceiptReversals = sqliteTable(
  'receipt_reversals',
  {
    id: text('id').primaryKey(),
    receipt_id: text('receipt_id')
      .notNull()
      .unique()
      .references(() => crmPaymentReceipts.id, { onDelete: 'cascade' }),
    replacement_receipt_id: text('replacement_receipt_id')
      .notNull()
      .references(() => crmPaymentReceipts.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    action_id: text('action_id').notNull(),
    created_at: text('created_at').notNull(),
  },
  (t) => [
    index('receipt_reversals_replacement_idx').on(t.replacement_receipt_id),
  ],
);

export const crmPaymentAllocations = sqliteTable(
  'payment_allocations',
  {
    id: text('id').primaryKey(),
    customer_id: text('customer_id')
      .notNull()
      .references(() => crmCustomers.id, { onDelete: 'cascade' }),
    receipt_id: text('receipt_id')
      .notNull()
      .references(() => crmPaymentReceipts.id, { onDelete: 'cascade' }),
    charge_id: text('charge_id')
      .notNull()
      .references(() => crmReceivableEntries.id, { onDelete: 'cascade' }),
    amount_paise: integer('amount_paise').notNull(),
    action_id: text('action_id').notNull(),
    created_at: text('created_at').notNull(),
  },
  (t) => [
    index('payment_allocations_customer_id_idx').on(t.customer_id),
    index('payment_allocations_receipt_id_idx').on(t.receipt_id),
    index('payment_allocations_charge_id_idx').on(t.charge_id),
    check(
      'payment_allocations_amount_paise_check',
      sql`typeof(${t.amount_paise}) = 'integer'`,
    ),
  ],
);

export type Receipt = typeof crmPaymentReceipts.$inferSelect;
export type ReceivableEntry = typeof crmReceivableEntries.$inferSelect;
export class ChargeBalance {
  constructor(
    readonly retainedPaise: number,
    readonly cashPaise: number,
    readonly creditPaise: number,
    readonly points: number,
  ) {}
  get outstandingPaise() {
    return safe(
      this.retainedPaise - this.cashPaise - this.creditPaise - this.points,
    );
  }
}
