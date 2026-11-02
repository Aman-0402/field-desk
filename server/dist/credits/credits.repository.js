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
import { and, desc, eq, gt, lt, min, sum } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { insertionOrder } from '../database/query-order.js';
import { safe, recordInsert } from '../common/domain.js';
import { crmCreditNotes, crmCreditFunds, crmCreditApplications, crmCreditRefunds, } from '../credits/credits.model.js';
let CreditsRepository = class CreditsRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    get db() {
        return this.database.db;
    }
    reservedFromReceipt(receiptId) {
        return safe(this.db
            .select({ value: sum(crmCreditFunds.amount_paise).mapWith(Number) })
            .from(crmCreditFunds)
            .where(eq(crmCreditFunds.receipt_id, receiptId))
            .get()?.value ?? 0);
    }
    appliedToCharge(chargeId) {
        return safe(this.db
            .select({
            value: sum(crmCreditApplications.amount_paise).mapWith(Number),
        })
            .from(crmCreditApplications)
            .where(eq(crmCreditApplications.charge_id, chargeId))
            .get()?.value ?? 0);
    }
    creditByNoteForCharge(chargeId) {
        return this.db
            .select({
            credit_note_id: crmCreditApplications.credit_note_id,
            n: sum(crmCreditApplications.amount_paise).mapWith(Number),
        })
            .from(crmCreditApplications)
            .where(eq(crmCreditApplications.charge_id, chargeId))
            .groupBy(crmCreditApplications.credit_note_id)
            .having(gt(sum(crmCreditApplications.amount_paise), 0))
            .orderBy(desc(min(insertionOrder(crmCreditApplications))))
            .all()
            .map((row) => ({ ...row, n: safe(row.n ?? 0) }));
    }
    findCustomerCredit(id, customerId) {
        return this.db
            .select()
            .from(crmCreditNotes)
            .where(and(eq(crmCreditNotes.id, id), eq(crmCreditNotes.customer_id, customerId)))
            .get();
    }
    appliedFromCredit(creditId) {
        return safe(this.db
            .select({
            value: sum(crmCreditApplications.amount_paise).mapWith(Number),
        })
            .from(crmCreditApplications)
            .where(eq(crmCreditApplications.credit_note_id, creditId))
            .get()?.value ?? 0);
    }
    refundedFromCredit(creditId) {
        return safe(this.db
            .select({ value: sum(crmCreditRefunds.amount_paise).mapWith(Number) })
            .from(crmCreditRefunds)
            .where(eq(crmCreditRefunds.credit_note_id, creditId))
            .get()?.value ?? 0);
    }
    fundsForCredit(creditId) {
        return this.db
            .select()
            .from(crmCreditFunds)
            .where(eq(crmCreditFunds.credit_note_id, creditId))
            .orderBy(insertionOrder(crmCreditFunds))
            .all();
    }
    refundedFromReceipt(creditId, receiptId) {
        return safe(this.db
            .select({ value: sum(crmCreditRefunds.amount_paise).mapWith(Number) })
            .from(crmCreditRefunds)
            .where(and(eq(crmCreditRefunds.credit_note_id, creditId), eq(crmCreditRefunds.receipt_id, receiptId)))
            .get()?.value ?? 0);
    }
    findCustomerApplication(id, customerId) {
        return this.db
            .select()
            .from(crmCreditApplications)
            .where(and(eq(crmCreditApplications.id, id), eq(crmCreditApplications.customer_id, customerId), gt(crmCreditApplications.amount_paise, 0)))
            .get();
    }
    applicationReversals(id) {
        return safe(this.db
            .select({
            value: sum(crmCreditApplications.amount_paise).mapWith(Number),
        })
            .from(crmCreditApplications)
            .where(eq(crmCreditApplications.reversal_of_id, id))
            .get()?.value ?? 0);
    }
    appliedBetween(creditId, chargeId) {
        return safe(this.db
            .select({
            value: sum(crmCreditApplications.amount_paise).mapWith(Number),
        })
            .from(crmCreditApplications)
            .where(and(eq(crmCreditApplications.credit_note_id, creditId), eq(crmCreditApplications.charge_id, chargeId)))
            .get()?.value ?? 0);
    }
    findCustomerRefund(id, customerId) {
        return this.db
            .select()
            .from(crmCreditRefunds)
            .where(and(eq(crmCreditRefunds.id, id), eq(crmCreditRefunds.customer_id, customerId), gt(crmCreditRefunds.amount_paise, 0)))
            .get();
    }
    refundReversals(id) {
        return safe(this.db
            .select({ value: sum(crmCreditRefunds.amount_paise).mapWith(Number) })
            .from(crmCreditRefunds)
            .where(eq(crmCreditRefunds.reversal_of_id, id))
            .get()?.value ?? 0);
    }
    creditsForCustomer(customerId) {
        return this.db
            .select()
            .from(crmCreditNotes)
            .where(eq(crmCreditNotes.customer_id, customerId))
            .orderBy(insertionOrder(crmCreditNotes))
            .all();
    }
    refundedForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmCreditRefunds.amount_paise).mapWith(Number) })
            .from(crmCreditRefunds)
            .where(eq(crmCreditRefunds.customer_id, customerId))
            .get()?.value ?? 0);
    }
    fundedForCredit(creditId) {
        return safe(this.db
            .select({ value: sum(crmCreditFunds.amount_paise).mapWith(Number) })
            .from(crmCreditFunds)
            .where(eq(crmCreditFunds.credit_note_id, creditId))
            .get()?.value ?? 0);
    }
    invalidApplications(creditId) {
        return this.db
            .select({ chargeId: crmCreditApplications.charge_id })
            .from(crmCreditApplications)
            .where(eq(crmCreditApplications.credit_note_id, creditId))
            .groupBy(crmCreditApplications.charge_id)
            .having(lt(sum(crmCreditApplications.amount_paise), 0))
            .all().length;
    }
    invalidRefunds(creditId, fundingCreditId) {
        const totals = this.db
            .select({
            receiptId: crmCreditRefunds.receipt_id,
            amount: sum(crmCreditRefunds.amount_paise).mapWith(Number),
        })
            .from(crmCreditRefunds)
            .where(eq(crmCreditRefunds.credit_note_id, creditId))
            .groupBy(crmCreditRefunds.receipt_id)
            .all();
        return totals.filter((row) => {
            const amount = row.amount ?? 0;
            const funding = this.db
                .select({ amount: sum(crmCreditFunds.amount_paise).mapWith(Number) })
                .from(crmCreditFunds)
                .where(and(eq(crmCreditFunds.credit_note_id, fundingCreditId), eq(crmCreditFunds.receipt_id, row.receiptId)))
                .get()?.amount ?? 0;
            return amount < 0 || amount > funding;
        }).length;
    }
    applicationsForCustomer(customerId) {
        return this.db
            .select()
            .from(crmCreditApplications)
            .where(eq(crmCreditApplications.customer_id, customerId))
            .orderBy(insertionOrder(crmCreditApplications))
            .all();
    }
    refundsForCustomer(customerId) {
        return this.db
            .select()
            .from(crmCreditRefunds)
            .where(eq(crmCreditRefunds.customer_id, customerId))
            .orderBy(insertionOrder(crmCreditRefunds))
            .all();
    }
    insertCredit(c, row) {
        this.db.insert(crmCreditNotes).values(row).run();
        recordInsert(c, 'credit_notes', row, false);
    }
    insertFunding(c, row) {
        this.db.insert(crmCreditFunds).values(row).run();
        recordInsert(c, 'credit_funds', row, false);
    }
    insertApplication(c, row) {
        this.db.insert(crmCreditApplications).values(row).run();
        recordInsert(c, 'credit_applications', row, true);
    }
    insertRefund(c, row) {
        this.db.insert(crmCreditRefunds).values(row).run();
        recordInsert(c, 'credit_refunds', row, true);
    }
};
CreditsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], CreditsRepository);
export { CreditsRepository };
let CreditsRepositoryModule = class CreditsRepositoryModule {
};
CreditsRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [CreditsRepository],
        exports: [CreditsRepository],
    })
], CreditsRepositoryModule);
export { CreditsRepositoryModule };
//# sourceMappingURL=credits.repository.js.map