import { safe } from '../common/domain.js';
import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, } from 'drizzle-orm/sqlite-core';
import { crmCustomers } from '../customers/customers.model.js';
import { crmReceivableEntries } from '../accounts/accounts.model.js';
export const crmRewardRedemptions = sqliteTable('reward_redemptions', {
    id: text('id').primaryKey(),
    customer_id: text('customer_id')
        .notNull()
        .references(() => crmCustomers.id, { onDelete: 'cascade' }),
    charge_id: text('charge_id')
        .notNull()
        .references(() => crmReceivableEntries.id, { onDelete: 'cascade' }),
    points: integer('points').notNull(),
    action_id: text('action_id').notNull(),
    created_at: text('created_at').notNull(),
}, (t) => [
    index('reward_redemptions_customer_id_idx').on(t.customer_id),
    index('reward_redemptions_charge_id_idx').on(t.charge_id),
    check('reward_redemptions_points_check', sql `typeof(${t.points}) = 'integer'`),
]);
export const crmRewardLedger = sqliteTable('reward_ledger', {
    id: text('id').primaryKey(),
    customer_id: text('customer_id')
        .notNull()
        .references(() => crmCustomers.id, { onDelete: 'cascade' }),
    line_key: text('line_key'),
    bucket: text('bucket').notNull(),
    points_delta: integer('points_delta').notNull(),
    source_id: text('source_id').notNull(),
    action_id: text('action_id').notNull(),
    created_at: text('created_at').notNull(),
}, (t) => [
    index('reward_ledger_customer_id_idx').on(t.customer_id),
    check('reward_ledger_points_delta_check', sql `typeof(${t.points_delta}) = 'integer'`),
]);
export class RewardEntitlement {
    static retained(approved, qty, canceled, returned, pointsPerUnit) {
        return approved
            ? safe(Math.max(0, qty - canceled - returned) * pointsPerUnit)
            : 0;
    }
    static cashEarned(cashPaise, pointsPerUnit, pricePaise) {
        return safe(Number((BigInt(cashPaise) * BigInt(pointsPerUnit)) / BigInt(pricePaise)));
    }
}
//# sourceMappingURL=rewards.model.js.map