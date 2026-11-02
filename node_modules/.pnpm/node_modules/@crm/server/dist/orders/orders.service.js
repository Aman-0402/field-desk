var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CustomersRepository } from '../customers/customers.repository.js';
import { OrdersRepository } from '../orders/orders.repository.js';
import { CatalogRepository } from '../catalog/catalog.repository.js';
import { FulfillmentRepository } from '../fulfillment/fulfillment.repository.js';
import { RewardsRepository } from '../rewards/rewards.repository.js';
import { RewardsService } from '../rewards/rewards.service.js';
import { ReturnsRepository } from '../returns/returns.repository.js';
import { AuditRepository } from '../audit/audit.repository.js';
import { useOrder, useCustomer, fail, safe, distinct, } from '../common/domain.js';
import { fulfillmentState, OrderModel } from './orders.model.js';
let OrdersService = class OrdersService {
    customersRepository;
    ordersRepository;
    catalogRepository;
    fulfillmentRepository;
    rewardsRepository;
    rewardsService;
    returnsRepository;
    auditRepository;
    constructor(customersRepository, ordersRepository, catalogRepository, fulfillmentRepository, rewardsRepository, rewardsService, returnsRepository, auditRepository) {
        this.customersRepository = customersRepository;
        this.ordersRepository = ordersRepository;
        this.catalogRepository = catalogRepository;
        this.fulfillmentRepository = fulfillmentRepository;
        this.rewardsRepository = rewardsRepository;
        this.rewardsService = rewardsService;
        this.returnsRepository = returnsRepository;
        this.auditRepository = auditRepository;
    }
    punch(c, p) {
        useCustomer(c, this.customersRepository.findById(p.customerId));
        const orderId = randomUUID();
        c.orderId = orderId;
        c.references.orderId = orderId;
        const revisionId = randomUUID();
        this.ordersRepository.insertOrder(c, {
            id: orderId,
            number: `SO-${Date.now().toString(36).toUpperCase()}-${orderId.slice(0, 4).toUpperCase()}`,
            customer_id: c.customerId,
            status: 'DRAFT',
            current_revision: 1,
            version: 0,
            created_at: c.now,
        });
        this.ordersRepository.insertRevision(c, {
            id: revisionId,
            order_id: orderId,
            revision: 1,
            actor_id: c.actor.id,
            reason: p.reason ?? 'Order created',
            created_at: c.now,
        });
        for (const item of p.items) {
            const sku = this.catalogRepository.findById(item.skuId);
            if (!sku)
                fail('SKU_NOT_FOUND', 'Select an existing SKU');
            safe(item.qty * item.unitPricePaise);
            this.ordersRepository.insertLine(c, {
                id: randomUUID(),
                revision_id: revisionId,
                order_id: orderId,
                line_key: randomUUID(),
                sku_id: sku.id,
                qty: item.qty,
                unit_price_paise: item.unitPricePaise,
                points_per_unit: sku.points_per_unit,
            });
        }
    }
    edit(c, p) {
        const order = useOrder(c, this.ordersRepository.findById(p.orderId));
        new OrderModel(order).assertEditable(Boolean(this.fulfillmentRepository.dispatchedCount(order.id)), Boolean(this.ordersRepository.cancellationCount(order.id)));
        const existing = this.ordersRepository.currentLines(order.id, order.current_revision);
        const revisionId = randomUUID();
        this.ordersRepository.insertRevision(c, {
            id: revisionId,
            order_id: order.id,
            revision: order.current_revision + 1,
            actor_id: c.actor.id,
            reason: p.reason,
            created_at: c.now,
        });
        for (const item of p.items) {
            const sku = this.catalogRepository.findById(item.skuId);
            if (!sku)
                fail('SKU_NOT_FOUND', 'Select an existing SKU');
            safe(item.qty * item.unitPricePaise);
            this.ordersRepository.insertLine(c, {
                id: randomUUID(),
                revision_id: revisionId,
                order_id: order.id,
                line_key: existing.find((line) => line.sku_id === sku.id)?.line_key ??
                    randomUUID(),
                sku_id: sku.id,
                qty: item.qty,
                unit_price_paise: item.unitPricePaise,
                points_per_unit: sku.points_per_unit,
            });
        }
        for (const shipment of this.fulfillmentRepository.loadingForOrder(order.id))
            this.fulfillmentRepository.updateShipment(c, shipment.id, {
                status: 'VOIDED',
            });
        this.ordersRepository.updateOrder(c, order.id, {
            current_revision: order.current_revision + 1,
            status: ['APPROVED', 'REAPPROVAL_REQUIRED'].includes(order.status)
                ? 'REAPPROVAL_REQUIRED'
                : 'DRAFT',
        });
        for (const line of existing) {
            const locked = this.rewardsRepository.lockedForLine(line.line_key);
            if (locked)
                this.rewardsRepository.insertPosting(c, {
                    id: randomUUID(),
                    customer_id: c.customerId,
                    line_key: line.line_key,
                    bucket: 'LOCKED',
                    points_delta: -locked,
                    source_id: revisionId,
                    action_id: c.id,
                    created_at: c.now,
                });
        }
    }
    submit(c, p) {
        const order = useOrder(c, this.ordersRepository.findById(p.orderId));
        new OrderModel(order).assertSubmittable();
        this.ordersRepository.updateOrder(c, order.id, {
            status: order.status === 'REAPPROVAL_REQUIRED'
                ? 'REAPPROVAL_REQUIRED'
                : 'PENDING',
        });
    }
    approve(c, p) {
        const order = useOrder(c, this.ordersRepository.findById(p.orderId));
        new OrderModel(order).assertReviewable(p.revision, 'APPROVED');
        this.ordersRepository.insertApproval(c, {
            id: randomUUID(),
            order_id: order.id,
            revision: p.revision,
            actor_id: c.actor.id,
            decision: 'APPROVED',
            reason: 'Commercial approval',
            created_at: c.now,
        });
        this.ordersRepository.updateOrder(c, order.id, { status: 'APPROVED' });
        for (const line of this.ordersRepository.currentLines(order.id, order.current_revision)) {
            const canceled = this.ordersRepository.canceledForLine(line.line_key);
            const current = this.rewardsRepository.lockedForLine(line.line_key);
            const desired = safe((line.qty - canceled) * line.points_per_unit);
            if (desired !== current)
                this.rewardsRepository.insertPosting(c, {
                    id: randomUUID(),
                    customer_id: c.customerId,
                    line_key: line.line_key,
                    bucket: 'LOCKED',
                    points_delta: desired - current,
                    source_id: order.id,
                    action_id: c.id,
                    created_at: c.now,
                });
        }
    }
    reject(c, p) {
        const order = useOrder(c, this.ordersRepository.findById(p.orderId));
        new OrderModel(order).assertReviewable(p.revision, 'REJECTED');
        this.ordersRepository.insertApproval(c, {
            id: randomUUID(),
            order_id: order.id,
            revision: p.revision,
            actor_id: c.actor.id,
            decision: 'REJECTED',
            reason: p.reason,
            created_at: c.now,
        });
        this.ordersRepository.updateOrder(c, order.id, { status: 'REJECTED' });
    }
    cancel(c, p) {
        const order = useOrder(c, this.ordersRepository.findById(p.orderId));
        const lines = this.ordersRepository.currentLines(order.id, order.current_revision);
        if (p.items) {
            distinct(p.items.map((item) => item.lineKey));
            for (const item of p.items)
                if (!lines.some((line) => line.line_key === item.lineKey))
                    fail('LINE_NOT_FOUND', 'Select a current line from this order');
        }
        let canceledTotal = 0;
        for (const shipment of this.fulfillmentRepository.loadingForOrder(order.id))
            this.fulfillmentRepository.updateShipment(c, shipment.id, {
                status: 'VOIDED',
            });
        for (const line of lines) {
            const sent = this.fulfillmentRepository.dispatchedForLine(line.line_key);
            const prior = this.ordersRepository.canceledForLine(line.line_key);
            const open = line.qty - sent - prior;
            const qty = p.items
                ? (p.items.find((item) => item.lineKey === line.line_key)?.qty ?? 0)
                : open;
            if (qty > open)
                fail('CANCEL_EXCEEDED', 'Only unshipped, uncanceled units can be canceled');
            if (qty > 0) {
                this.ordersRepository.insertCancellation(c, {
                    id: randomUUID(),
                    order_id: order.id,
                    line_key: line.line_key,
                    qty,
                    reason: p.reason,
                    action_id: c.id,
                    created_at: c.now,
                });
                canceledTotal += qty;
            }
        }
        if (!canceledTotal)
            fail('NOTHING_TO_CANCEL', 'There are no unshipped units to cancel');
        if (lines.every((line) => line.qty === this.ordersRepository.canceledForLine(line.line_key)) &&
            !this.fulfillmentRepository.dispatchedForOrder(order.id))
            this.ordersRepository.updateOrder(c, order.id, { status: 'CANCELLED' });
        this.rewardsService.refresh(c);
    }
    detail(id) {
        const order = this.ordersRepository.findById(id);
        if (!order)
            throw new NotFoundException('Order not found');
        const lines = this.ordersRepository
            .currentLines(order.id, order.current_revision)
            .map((line) => {
            const sku = this.catalogRepository.findById(line.sku_id);
            const canceled = this.ordersRepository.canceledForLine(line.line_key);
            const loaded = this.fulfillmentRepository.loadingForLine(line.line_key);
            const dispatched = this.fulfillmentRepository.dispatchedForLine(line.line_key);
            const delivered = this.fulfillmentRepository.deliveredForLine(line.line_key);
            const returned = this.returnsRepository.returnedForLine(line.line_key);
            return {
                lineKey: line.line_key,
                skuId: line.sku_id,
                code: sku.code,
                name: sku.name,
                qty: line.qty,
                approved: this.ordersRepository.approvalCount(order.id, order.current_revision)
                    ? line.qty
                    : 0,
                unitPricePaise: line.unit_price_paise,
                canceled,
                loaded,
                dispatched,
                delivered,
                returned,
                open: line.qty - canceled - dispatched,
            };
        });
        const shipments = this.fulfillmentRepository
            .forOrder(id)
            .map((shipment) => ({
            ...shipment,
            lines: this.fulfillmentRepository
                .linesForShipment(shipment.id)
                .map((line) => ({
                ...line,
                delivered: this.fulfillmentRepository.deliveredForShipmentLine(line.id),
                returned: this.returnsRepository.returnedForShipmentLine(line.id),
            })),
        }));
        const revisions = this.ordersRepository
            .revisionsForOrder(id)
            .map((revision) => ({
            ...revision,
            lines: this.ordersRepository.linesForRevision(revision.id),
        }));
        return {
            order,
            lines,
            shipments,
            revisions,
            approvals: this.ordersRepository.approvalsForOrder(id),
            timeline: this.auditRepository.eventsForOrder(id),
        };
    }
    list() {
        return this.ordersRepository
            .progressRows()
            .map(({ orderedQty, canceledQty, loadingQty, dispatchedQty, deliveredQty, ...order }) => ({
            ...order,
            fulfillmentStatus: fulfillmentState({
                orderedQty,
                canceledQty,
                loadingQty,
                dispatchedQty,
                deliveredQty,
            }),
        }));
    }
    forCustomer(customerId) {
        return this.ordersRepository
            .forCustomer(customerId)
            .map((order) => this.detail(order.id));
    }
};
OrdersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CustomersRepository,
        OrdersRepository,
        CatalogRepository,
        FulfillmentRepository,
        RewardsRepository,
        RewardsService,
        ReturnsRepository,
        AuditRepository])
], OrdersService);
export { OrdersService };
//# sourceMappingURL=orders.service.js.map