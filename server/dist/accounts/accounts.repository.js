var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, Module } from '@nestjs/common';
import { and, asc, desc, eq, getTableColumns, gt, inArray, lt, min, notExists, sum, } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { insertionOrder } from '../database/query-order.js';
import { safe, recordInsert } from '../common/domain.js';
import { crmReceivableEntries, crmPaymentReceipts, crmPaymentAllocations, crmReceiptReversals, } from '../accounts/accounts.model.js';
let AccountsRepository = class AccountsRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    get db() {
        return this.database.db;
    }
    findCharge(id) {
        return this.db
            .select()
            .from(crmReceivableEntries)
            .where(eq(crmReceivableEntries.id, id))
            .get();
    }
    cashForLine(lineKey) {
        return safe(this.db
            .select({
            value: sum(crmPaymentAllocations.amount_paise).mapWith(Number),
        })
            .from(crmPaymentAllocations)
            .innerJoin(crmReceivableEntries, eq(crmReceivableEntries.id, crmPaymentAllocations.charge_id))
            .where(eq(crmReceivableEntries.line_key, lineKey))
            .get()?.value ?? 0);
    }
    /** A receipt is live until a move reverses it (ACC-004). */
    notReversed() {
        return notExists(this.db
            .select({ id: crmReceiptReversals.id })
            .from(crmReceiptReversals)
            .where(eq(crmReceiptReversals.receipt_id, crmPaymentReceipts.id)));
    }
    /** Live receipts in cash-priority order (ACC-003). */
    receiptsForCustomer(customerId) {
        return this.db
            .select()
            .from(crmPaymentReceipts)
            .where(and(eq(crmPaymentReceipts.customer_id, customerId), this.notReversed()))
            .orderBy(asc(crmPaymentReceipts.created_at), insertionOrder(crmPaymentReceipts))
            .all();
    }
    findLiveReceipt(id, customerId) {
        return this.db
            .select()
            .from(crmPaymentReceipts)
            .where(and(eq(crmPaymentReceipts.id, id), eq(crmPaymentReceipts.customer_id, customerId), this.notReversed()))
            .get();
    }
    /** Net cash a receipt currently holds against each charge. */
    allocatedByCharge(receiptId) {
        return this.db
            .select({
            charge_id: crmPaymentAllocations.charge_id,
            n: sum(crmPaymentAllocations.amount_paise).mapWith(Number),
        })
            .from(crmPaymentAllocations)
            .where(eq(crmPaymentAllocations.receipt_id, receiptId))
            .groupBy(crmPaymentAllocations.charge_id)
            .having(gt(sum(crmPaymentAllocations.amount_paise), 0))
            .orderBy(asc(min(insertionOrder(crmPaymentAllocations))))
            .all()
            .map((row) => ({ ...row, n: safe(row.n ?? 0) }));
    }
    reversalForReceipt(receiptId) {
        return this.db
            .select({
            replacement_id: crmReceiptReversals.replacement_receipt_id,
            customer_id: crmPaymentReceipts.customer_id,
            amount_paise: crmPaymentReceipts.amount_paise,
        })
            .from(crmReceiptReversals)
            .innerJoin(crmPaymentReceipts, eq(crmPaymentReceipts.id, crmReceiptReversals.replacement_receipt_id))
            .where(eq(crmReceiptReversals.receipt_id, receiptId))
            .get();
    }
    /** CUS-001: allocations whose receipt or charge belongs to another customer. */
    crossAccountAllocations(customerId) {
        return this.db
            .select({ id: crmPaymentAllocations.id })
            .from(crmPaymentAllocations)
            .innerJoin(crmPaymentReceipts, eq(crmPaymentReceipts.id, crmPaymentAllocations.receipt_id))
            .innerJoin(crmReceivableEntries, eq(crmReceivableEntries.id, crmPaymentAllocations.charge_id))
            .where(and(eq(crmPaymentAllocations.customer_id, customerId), sql `(${crmPaymentReceipts.customer_id} <> ${crmPaymentAllocations.customer_id} or ${crmReceivableEntries.customer_id} <> ${crmPaymentAllocations.customer_id})`))
            .all().length;
    }
    allocatedFromReceipt(receiptId) {
        return safe(this.db
            .select({
            value: sum(crmPaymentAllocations.amount_paise).mapWith(Number),
        })
            .from(crmPaymentAllocations)
            .where(eq(crmPaymentAllocations.receipt_id, receiptId))
            .get()?.value ?? 0);
    }
    chargesInDueOrder(customerId) {
        return this.db
            .select()
            .from(crmReceivableEntries)
            .where(and(eq(crmReceivableEntries.customer_id, customerId), gt(crmReceivableEntries.amount_paise, 0)))
            .orderBy(asc(crmReceivableEntries.created_at), insertionOrder(crmReceivableEntries))
            .all();
    }
    adjustmentsForCharge(chargeId) {
        return safe(this.db
            .select({
            value: sum(crmReceivableEntries.amount_paise).mapWith(Number),
        })
            .from(crmReceivableEntries)
            .where(eq(crmReceivableEntries.adjusts_id, chargeId))
            .get()?.value ?? 0);
    }
    cashForCharge(chargeId) {
        return safe(this.db
            .select({
            value: sum(crmPaymentAllocations.amount_paise).mapWith(Number),
        })
            .from(crmPaymentAllocations)
            .where(eq(crmPaymentAllocations.charge_id, chargeId))
            .get()?.value ?? 0);
    }
    chargesForLine(lineKey) {
        return this.db
            .select()
            .from(crmReceivableEntries)
            .where(and(eq(crmReceivableEntries.line_key, lineKey), gt(crmReceivableEntries.amount_paise, 0)))
            .orderBy(insertionOrder(crmReceivableEntries))
            .all();
    }
    chargesForShipmentLine(lineId) {
        return this.db
            .select()
            .from(crmReceivableEntries)
            .where(and(eq(crmReceivableEntries.shipment_line_id, lineId), gt(crmReceivableEntries.amount_paise, 0)))
            .orderBy(insertionOrder(crmReceivableEntries))
            .all();
    }
    cashByReceiptForCharge(chargeId) {
        return this.db
            .select({
            receipt_id: crmPaymentAllocations.receipt_id,
            n: sum(crmPaymentAllocations.amount_paise).mapWith(Number),
        })
            .from(crmPaymentAllocations)
            .where(eq(crmPaymentAllocations.charge_id, chargeId))
            .groupBy(crmPaymentAllocations.receipt_id)
            .having(gt(sum(crmPaymentAllocations.amount_paise), 0))
            .orderBy(desc(min(insertionOrder(crmPaymentAllocations))))
            .all()
            .map((row) => ({ ...row, n: safe(row.n ?? 0) }));
    }
    findCustomerCharge(id, customerId) {
        return this.db
            .select()
            .from(crmReceivableEntries)
            .where(and(eq(crmReceivableEntries.id, id), eq(crmReceivableEntries.customer_id, customerId), gt(crmReceivableEntries.amount_paise, 0)))
            .get();
    }
    /** Every receipt, reversed ones included and marked, for the ledger and audit. */
    receiptsByInsertion(customerId) {
        return this.db
            .select({
            ...getTableColumns(crmPaymentReceipts),
            reversed_at: crmReceiptReversals.created_at,
        })
            .from(crmPaymentReceipts)
            .leftJoin(crmReceiptReversals, eq(crmReceiptReversals.receipt_id, crmPaymentReceipts.id))
            .where(eq(crmPaymentReceipts.customer_id, customerId))
            .orderBy(insertionOrder(crmPaymentReceipts))
            .all();
    }
    liveReceiptsByInsertion(customerId) {
        return this.db
            .select()
            .from(crmPaymentReceipts)
            .where(and(eq(crmPaymentReceipts.customer_id, customerId), this.notReversed()))
            .orderBy(insertionOrder(crmPaymentReceipts))
            .all();
    }
    chargesForCustomer(customerId) {
        return this.db
            .select()
            .from(crmReceivableEntries)
            .where(and(eq(crmReceivableEntries.customer_id, customerId), gt(crmReceivableEntries.amount_paise, 0)))
            .orderBy(insertionOrder(crmReceivableEntries))
            .all();
    }
    receivedForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmPaymentReceipts.amount_paise).mapWith(Number) })
            .from(crmPaymentReceipts)
            .where(and(eq(crmPaymentReceipts.customer_id, customerId), this.notReversed()))
            .get()?.value ?? 0);
    }
    postedForCustomer(customerId) {
        return safe(this.db
            .select({
            value: sum(crmReceivableEntries.amount_paise).mapWith(Number),
        })
            .from(crmReceivableEntries)
            .where(eq(crmReceivableEntries.customer_id, customerId))
            .get()?.value ?? 0);
    }
    chargesForDelivery(deliveryId) {
        return this.db
            .select()
            .from(crmReceivableEntries)
            .where(and(eq(crmReceivableEntries.source_id, deliveryId), inArray(crmReceivableEntries.kind, [
            'DELIVERY',
            'CORRECTION',
            'DELIVERY_REVERSAL',
        ])))
            .orderBy(insertionOrder(crmReceivableEntries))
            .all();
    }
    invalidReceiptAllocations(receiptId) {
        return this.db
            .select({ chargeId: crmPaymentAllocations.charge_id })
            .from(crmPaymentAllocations)
            .where(eq(crmPaymentAllocations.receipt_id, receiptId))
            .groupBy(crmPaymentAllocations.charge_id)
            .having(lt(sum(crmPaymentAllocations.amount_paise), 0))
            .all().length;
    }
    entriesForCustomer(customerId) {
        return this.db
            .select()
            .from(crmReceivableEntries)
            .where(eq(crmReceivableEntries.customer_id, customerId))
            .orderBy(insertionOrder(crmReceivableEntries))
            .all();
    }
    allocationsForCustomer(customerId) {
        return this.db
            .select()
            .from(crmPaymentAllocations)
            .where(eq(crmPaymentAllocations.customer_id, customerId))
            .orderBy(insertionOrder(crmPaymentAllocations))
            .all();
    }
    insertCharge(c, row) {
        this.db.insert(crmReceivableEntries).values(row).run();
        recordInsert(c, 'receivable_entries', row, true);
    }
    insertReceipt(c, row) {
        this.db.insert(crmPaymentReceipts).values(row).run();
        recordInsert(c, 'payment_receipts', row, false);
    }
    insertReceiptReversal(c, row) {
        this.db.insert(crmReceiptReversals).values(row).run();
        recordInsert(c, 'receipt_reversals', row, false);
    }
    insertAllocation(c, row) {
        this.db.insert(crmPaymentAllocations).values(row).run();
        recordInsert(c, 'payment_allocations', row, true);
    }
};
AccountsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], AccountsRepository);
export { AccountsRepository };
let AccountsRepositoryModule = class AccountsRepositoryModule {
};
AccountsRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [AccountsRepository],
        exports: [AccountsRepository],
    })
], AccountsRepositoryModule);
export { AccountsRepositoryModule };
//# sourceMappingURL=accounts.repository.js.map