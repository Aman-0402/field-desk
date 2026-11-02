var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { RewardEntitlement } from './rewards.model.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CustomersRepository } from '../customers/customers.repository.js';
import { RewardsRepository } from '../rewards/rewards.repository.js';
import { AccountsRepository } from '../accounts/accounts.repository.js';
import { CreditsRepository } from '../credits/credits.repository.js';
import { OrdersRepository } from '../orders/orders.repository.js';
import { ReturnsRepository } from '../returns/returns.repository.js';
import { useCustomer, fail, safe } from '../common/domain.js';
let RewardsService = class RewardsService {
    customersRepository;
    rewardsRepository;
    accountsRepository;
    creditsRepository;
    ordersRepository;
    returnsRepository;
    constructor(customersRepository, rewardsRepository, accountsRepository, creditsRepository, ordersRepository, returnsRepository) {
        this.customersRepository = customersRepository;
        this.rewardsRepository = rewardsRepository;
        this.accountsRepository = accountsRepository;
        this.creditsRepository = creditsRepository;
        this.ordersRepository = ordersRepository;
        this.returnsRepository = returnsRepository;
    }
    redeem(c, p) {
        useCustomer(c, this.customersRepository.findById(p.customerId));
        const balance = this.rewardsRepository.availableForCustomer(c.customerId);
        const debt = this.rewardsRepository.debtForCustomer(c.customerId);
        if (debt || p.points > balance)
            fail('POINTS_UNAVAILABLE', 'There are not enough available points');
        const charge = this.accountsRepository.findCustomerCharge(p.chargeId, c.customerId);
        if (!charge)
            fail('CHARGE_NOT_FOUND', 'Select an outstanding charge belonging to this customer');
        const due = charge.amount_paise +
            this.accountsRepository.adjustmentsForCharge(charge.id) -
            this.accountsRepository.cashForCharge(charge.id) -
            this.creditsRepository.appliedToCharge(charge.id) -
            this.rewardsRepository.redeemedForCharge(charge.id);
        if (p.points > due)
            fail('AMOUNT_EXCEEDED', 'The redemption exceeds the outstanding charge');
        this.rewardsRepository.insertRedemption(c, {
            id: randomUUID(),
            customer_id: c.customerId,
            charge_id: charge.id,
            points: p.points,
            action_id: c.id,
            created_at: c.now,
        });
        this.rewardsRepository.insertPosting(c, {
            id: randomUUID(),
            customer_id: c.customerId,
            line_key: null,
            bucket: 'AVAILABLE',
            points_delta: -p.points,
            source_id: charge.id,
            action_id: c.id,
            created_at: c.now,
        });
        this.rewardsRepository.insertPosting(c, {
            id: randomUUID(),
            customer_id: c.customerId,
            line_key: null,
            bucket: 'REDEEMED',
            points_delta: p.points,
            source_id: charge.id,
            action_id: c.id,
            created_at: c.now,
        });
    }
    refresh(c) {
        for (const orderRow of this.ordersRepository.forCustomer(c.customerId)) {
            for (const lineRow of this.ordersRepository.currentLines(orderRow.id, orderRow.current_revision)) {
                const canceledQty = this.ordersRepository.canceledForLine(lineRow.line_key);
                const returnedQty = this.returnsRepository.returnedForLine(lineRow.line_key);
                const entitled = RewardEntitlement.retained(orderRow.status === 'APPROVED', lineRow.qty, canceledQty, returnedQty, lineRow.points_per_unit);
                let earned = 0;
                for (const chargeRow of this.accountsRepository.chargesForLine(lineRow.line_key)) {
                    const qualifyingCash = this.accountsRepository.cashForCharge(chargeRow.id);
                    earned = safe(earned +
                        RewardEntitlement.cashEarned(qualifyingCash, lineRow.points_per_unit, lineRow.unit_price_paise));
                }
                earned = Math.min(entitled, earned);
                const previousEarned = this.rewardsRepository.earnedForLine(lineRow.line_key);
                if (earned !== previousEarned)
                    this.rewardsRepository.insertPosting(c, {
                        id: randomUUID(),
                        customer_id: c.customerId,
                        line_key: lineRow.line_key,
                        bucket: 'AVAILABLE',
                        points_delta: earned - previousEarned,
                        source_id: c.id,
                        action_id: c.id,
                        created_at: c.now,
                    });
                const previousLocked = this.rewardsRepository.lockedForLine(lineRow.line_key);
                if (entitled - earned !== previousLocked)
                    this.rewardsRepository.insertPosting(c, {
                        id: randomUUID(),
                        customer_id: c.customerId,
                        line_key: lineRow.line_key,
                        bucket: 'LOCKED',
                        points_delta: entitled - earned - previousLocked,
                        source_id: c.id,
                        action_id: c.id,
                        created_at: c.now,
                    });
            }
        }
        const spendable = this.rewardsRepository.availableForCustomer(c.customerId);
        const outstandingClawback = this.rewardsRepository.debtForCustomer(c.customerId);
        if (spendable < 0) {
            this.rewardsRepository.insertPosting(c, {
                id: randomUUID(),
                customer_id: c.customerId,
                line_key: null,
                bucket: 'AVAILABLE',
                points_delta: -spendable,
                source_id: c.id,
                action_id: c.id,
                created_at: c.now,
            });
            this.rewardsRepository.insertPosting(c, {
                id: randomUUID(),
                customer_id: c.customerId,
                line_key: null,
                bucket: 'CLAWBACK_PENDING',
                points_delta: -spendable,
                source_id: c.id,
                action_id: c.id,
                created_at: c.now,
            });
        }
        else if (outstandingClawback > 0 && spendable > 0) {
            const offset = Math.min(outstandingClawback, spendable);
            this.rewardsRepository.insertPosting(c, {
                id: randomUUID(),
                customer_id: c.customerId,
                line_key: null,
                bucket: 'AVAILABLE',
                points_delta: -offset,
                source_id: c.id,
                action_id: c.id,
                created_at: c.now,
            });
            this.rewardsRepository.insertPosting(c, {
                id: randomUUID(),
                customer_id: c.customerId,
                line_key: null,
                bucket: 'CLAWBACK_PENDING',
                points_delta: -offset,
                source_id: c.id,
                action_id: c.id,
                created_at: c.now,
            });
        }
    }
    balances(customerId) {
        return {
            locked: this.rewardsRepository.lockedForCustomer(customerId),
            available: this.rewardsRepository.availableForCustomer(customerId),
            redeemed: this.rewardsRepository.spentForCustomer(customerId),
            clawbackPending: this.rewardsRepository.debtForCustomer(customerId),
        };
    }
    forCustomer(customerId) {
        if (!this.customersRepository.findById(customerId))
            throw new NotFoundException('Customer not found');
        return {
            points: this.balances(customerId),
            entries: this.rewardsRepository.entriesForCustomer(customerId),
            redemptions: this.rewardsRepository.redemptionsForCustomer(customerId),
        };
    }
};
RewardsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CustomersRepository,
        RewardsRepository,
        AccountsRepository,
        CreditsRepository,
        OrdersRepository,
        ReturnsRepository])
], RewardsService);
export { RewardsService };
//# sourceMappingURL=rewards.service.js.map