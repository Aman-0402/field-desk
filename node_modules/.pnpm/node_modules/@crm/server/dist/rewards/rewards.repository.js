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
import { and, eq, sum } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { insertionOrder } from '../database/query-order.js';
import { safe, recordInsert } from '../common/domain.js';
import { crmRewardRedemptions, crmRewardLedger, } from '../rewards/rewards.model.js';
let RewardsRepository = class RewardsRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    get db() {
        return this.database.db;
    }
    lockedForLine(lineKey) {
        return safe(this.db
            .select({ value: sum(crmRewardLedger.points_delta).mapWith(Number) })
            .from(crmRewardLedger)
            .where(and(eq(crmRewardLedger.line_key, lineKey), eq(crmRewardLedger.bucket, 'LOCKED')))
            .get()?.value ?? 0);
    }
    redeemedForCharge(chargeId) {
        return safe(this.db
            .select({ value: sum(crmRewardRedemptions.points).mapWith(Number) })
            .from(crmRewardRedemptions)
            .where(eq(crmRewardRedemptions.charge_id, chargeId))
            .get()?.value ?? 0);
    }
    earnedForLine(lineKey) {
        return safe(this.db
            .select({ value: sum(crmRewardLedger.points_delta).mapWith(Number) })
            .from(crmRewardLedger)
            .where(and(eq(crmRewardLedger.line_key, lineKey), eq(crmRewardLedger.bucket, 'AVAILABLE')))
            .get()?.value ?? 0);
    }
    availableForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmRewardLedger.points_delta).mapWith(Number) })
            .from(crmRewardLedger)
            .where(and(eq(crmRewardLedger.customer_id, customerId), eq(crmRewardLedger.bucket, 'AVAILABLE')))
            .get()?.value ?? 0);
    }
    debtForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmRewardLedger.points_delta).mapWith(Number) })
            .from(crmRewardLedger)
            .where(and(eq(crmRewardLedger.customer_id, customerId), eq(crmRewardLedger.bucket, 'CLAWBACK_PENDING')))
            .get()?.value ?? 0);
    }
    redeemedForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmRewardRedemptions.points).mapWith(Number) })
            .from(crmRewardRedemptions)
            .where(eq(crmRewardRedemptions.customer_id, customerId))
            .get()?.value ?? 0);
    }
    lockedForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmRewardLedger.points_delta).mapWith(Number) })
            .from(crmRewardLedger)
            .where(and(eq(crmRewardLedger.customer_id, customerId), eq(crmRewardLedger.bucket, 'LOCKED')))
            .get()?.value ?? 0);
    }
    spentForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmRewardLedger.points_delta).mapWith(Number) })
            .from(crmRewardLedger)
            .where(and(eq(crmRewardLedger.customer_id, customerId), eq(crmRewardLedger.bucket, 'REDEEMED')))
            .get()?.value ?? 0);
    }
    redemptionsForCustomer(customerId) {
        return this.db
            .select()
            .from(crmRewardRedemptions)
            .where(eq(crmRewardRedemptions.customer_id, customerId))
            .orderBy(insertionOrder(crmRewardRedemptions))
            .all();
    }
    entriesForCustomer(customerId) {
        return this.db
            .select()
            .from(crmRewardLedger)
            .where(eq(crmRewardLedger.customer_id, customerId))
            .orderBy(insertionOrder(crmRewardLedger))
            .all();
    }
    insertRedemption(c, row) {
        this.db.insert(crmRewardRedemptions).values(row).run();
        recordInsert(c, 'reward_redemptions', row, true);
    }
    insertPosting(c, row) {
        this.db.insert(crmRewardLedger).values(row).run();
        recordInsert(c, 'reward_ledger', row, true);
    }
};
RewardsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], RewardsRepository);
export { RewardsRepository };
let RewardsRepositoryModule = class RewardsRepositoryModule {
};
RewardsRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [RewardsRepository],
        exports: [RewardsRepository],
    })
], RewardsRepositoryModule);
export { RewardsRepositoryModule };
//# sourceMappingURL=rewards.repository.js.map