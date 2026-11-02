var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ReturnQuantity } from './returns.model.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OrdersRepository } from '../orders/orders.repository.js';
import { FulfillmentRepository } from '../fulfillment/fulfillment.repository.js';
import { ReturnsRepository } from '../returns/returns.repository.js';
import { AccountsRepository } from '../accounts/accounts.repository.js';
import { CreditsRepository } from '../credits/credits.repository.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { CustomersRepository } from '../customers/customers.repository.js';
import { useOrder, fail, safe, distinct } from '../common/domain.js';
let ReturnsService = class ReturnsService {
    ordersRepository;
    fulfillmentRepository;
    returnsRepository;
    accountsRepository;
    creditsRepository;
    accountsService;
    customersRepository;
    constructor(ordersRepository, fulfillmentRepository, returnsRepository, accountsRepository, creditsRepository, accountsService, customersRepository) {
        this.ordersRepository = ordersRepository;
        this.fulfillmentRepository = fulfillmentRepository;
        this.returnsRepository = returnsRepository;
        this.accountsRepository = accountsRepository;
        this.creditsRepository = creditsRepository;
        this.accountsService = accountsService;
        this.customersRepository = customersRepository;
    }
    returnItems(c, p) {
        const order = useOrder(c, this.ordersRepository.findById(p.orderId));
        distinct(p.items.map((item) => item.shipmentLineId));
        const returned = p.items.map((item) => {
            const line = this.fulfillmentRepository.findInOrder(item.shipmentLineId, order.id);
            if (!line)
                fail('LINE_NOT_FOUND', 'Select a line from this order');
            const delivered = this.fulfillmentRepository.deliveredForShipmentLine(line.id);
            const prior = this.returnsRepository.returnedForShipmentLine(line.id);
            new ReturnQuantity(delivered, prior).assertReturnable(item.qty);
            return {
                line,
                qty: item.qty,
                amount: safe(item.qty * line.unit_price_paise),
            };
        });
        const gross = safe(returned.reduce((sum, item) => sum + item.amount, 0));
        ReturnQuantity.assertFee(gross, p.feePaise);
        const returnId = randomUUID();
        c.references.returnId = returnId;
        this.returnsRepository.insertReturn(c, {
            id: returnId,
            customer_id: c.customerId,
            order_id: order.id,
            gross_paise: gross,
            fee_paise: p.feePaise,
            reason: p.reason,
            action_id: c.id,
            created_at: c.now,
        });
        const released = new Map();
        for (const { line, qty, amount } of returned) {
            this.returnsRepository.insertReturnLine(c, {
                id: randomUUID(),
                return_id: returnId,
                shipment_line_id: line.id,
                qty,
                amount_paise: amount,
            });
            let remaining = amount;
            for (const charge of this.accountsRepository.chargesForShipmentLine(line.id)) {
                if (!remaining)
                    break;
                const face = charge.amount_paise +
                    this.accountsRepository.adjustmentsForCharge(charge.id);
                const reduction = Math.min(face, remaining);
                if (!reduction)
                    continue;
                this.accountsRepository.insertCharge(c, {
                    id: randomUUID(),
                    customer_id: c.customerId,
                    order_id: order.id,
                    line_key: line.line_key,
                    shipment_line_id: line.id,
                    kind: 'RETURN',
                    amount_paise: -reduction,
                    adjusts_id: charge.id,
                    source_id: returnId,
                    action_id: c.id,
                    created_at: c.now,
                });
                remaining -= reduction;
                this.accountsService.releaseSettlement(c, charge, face - reduction, returnId, released);
            }
            if (remaining)
                fail('CHARGE_MISMATCH', 'Delivered charges do not cover this return');
        }
        if (p.feePaise) {
            const feeId = randomUUID();
            let due = p.feePaise;
            this.accountsRepository.insertCharge(c, {
                id: feeId,
                customer_id: c.customerId,
                order_id: order.id,
                line_key: null,
                shipment_line_id: null,
                kind: 'RETURN_FEE',
                amount_paise: p.feePaise,
                adjusts_id: null,
                source_id: returnId,
                action_id: c.id,
                created_at: c.now,
            });
            for (const [receiptId, available] of released) {
                const take = Math.min(due, available);
                if (!take)
                    continue;
                this.accountsRepository.insertAllocation(c, {
                    id: randomUUID(),
                    customer_id: c.customerId,
                    receipt_id: receiptId,
                    charge_id: feeId,
                    amount_paise: take,
                    action_id: c.id,
                    created_at: c.now,
                });
                released.set(receiptId, available - take);
                due -= take;
            }
        }
        const credit = safe([...released.values()].reduce((sum, value) => sum + value, 0));
        if (credit) {
            const creditId = randomUUID();
            c.references.creditNoteId = creditId;
            this.creditsRepository.insertCredit(c, {
                id: creditId,
                customer_id: c.customerId,
                return_id: returnId,
                amount_paise: credit,
                reason: p.reason,
                action_id: c.id,
                created_at: c.now,
            });
            for (const [receiptId, amount] of released)
                if (amount)
                    this.creditsRepository.insertFunding(c, {
                        id: randomUUID(),
                        credit_note_id: creditId,
                        receipt_id: receiptId,
                        amount_paise: amount,
                    });
        }
    }
    forCustomer(customerId) {
        if (!this.customersRepository.findById(customerId))
            throw new NotFoundException('Customer not found');
        return this.returnsRepository.forCustomer(customerId);
    }
};
ReturnsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OrdersRepository,
        FulfillmentRepository,
        ReturnsRepository,
        AccountsRepository,
        CreditsRepository,
        AccountsService,
        CustomersRepository])
], ReturnsService);
export { ReturnsService };
//# sourceMappingURL=returns.service.js.map