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
import { and, count, eq, getTableColumns, isNotNull, ne, sum, } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { insertionOrder } from '../database/query-order.js';
import { safe, recordInsert, recordUpdate, fail } from '../common/domain.js';
import { crmOrders } from '../orders/orders.model.js';
import { crmShipments, crmShipmentLines, crmDeliveries, crmCorrections, } from '../fulfillment/fulfillment.model.js';
let FulfillmentRepository = class FulfillmentRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    get db() {
        return this.database.db;
    }
    findLine(id) {
        return this.db
            .select()
            .from(crmShipmentLines)
            .where(eq(crmShipmentLines.id, id))
            .get();
    }
    dispatchedCount(orderId) {
        return (this.db
            .select({ value: count() })
            .from(crmShipments)
            .where(and(eq(crmShipments.order_id, orderId), isNotNull(crmShipments.dispatched_at)))
            .get()?.value ?? 0);
    }
    loadingForOrder(orderId) {
        return this.db
            .select()
            .from(crmShipments)
            .where(and(eq(crmShipments.order_id, orderId), eq(crmShipments.status, 'LOADING')))
            .orderBy(insertionOrder(crmShipments))
            .all();
    }
    reservedForLine(lineKey, excludedShipmentId) {
        return safe(this.db
            .select({ value: sum(crmShipmentLines.loaded_qty).mapWith(Number) })
            .from(crmShipmentLines)
            .innerJoin(crmShipments, eq(crmShipments.id, crmShipmentLines.shipment_id))
            .where(and(eq(crmShipmentLines.line_key, lineKey), ne(crmShipments.status, 'VOIDED'), ne(crmShipments.id, excludedShipmentId)))
            .get()?.value ?? 0);
    }
    findForOrder(id, orderId) {
        return this.db
            .select()
            .from(crmShipments)
            .where(and(eq(crmShipments.id, id), eq(crmShipments.order_id, orderId)))
            .get();
    }
    linesForShipment(shipmentId) {
        return this.db
            .select()
            .from(crmShipmentLines)
            .where(eq(crmShipmentLines.shipment_id, shipmentId))
            .orderBy(insertionOrder(crmShipmentLines))
            .all();
    }
    findInShipment(id, shipmentId) {
        return this.db
            .select()
            .from(crmShipmentLines)
            .where(and(eq(crmShipmentLines.id, id), eq(crmShipmentLines.shipment_id, shipmentId)))
            .get();
    }
    deliveredForShipmentLine(lineId) {
        return safe(this.db
            .select({ value: sum(crmDeliveries.qty).mapWith(Number) })
            .from(crmDeliveries)
            .where(eq(crmDeliveries.shipment_line_id, lineId))
            .get()?.value ?? 0);
    }
    /** Delivery rows of a line in recording order, reversals included. */
    deliveriesForShipmentLine(lineId) {
        return this.db
            .select()
            .from(crmDeliveries)
            .where(eq(crmDeliveries.shipment_line_id, lineId))
            .orderBy(insertionOrder(crmDeliveries))
            .all();
    }
    /** Units of one delivery already taken back by reversal rows. */
    reversedForDelivery(deliveryId) {
        return safe(-(this.db
            .select({ value: sum(crmDeliveries.qty).mapWith(Number) })
            .from(crmDeliveries)
            .where(eq(crmDeliveries.reverses_id, deliveryId))
            .get()?.value ?? 0));
    }
    undeliveredForShipment(shipmentId) {
        return safe(this.linesForShipment(shipmentId).reduce((total, line) => total + line.dispatched_qty - this.deliveredForShipmentLine(line.id), 0));
    }
    dispatchedForLine(lineKey) {
        return safe(this.db
            .select({ value: sum(crmShipmentLines.dispatched_qty).mapWith(Number) })
            .from(crmShipmentLines)
            .innerJoin(crmShipments, eq(crmShipments.id, crmShipmentLines.shipment_id))
            .where(and(eq(crmShipmentLines.line_key, lineKey), ne(crmShipments.status, 'VOIDED')))
            .get()?.value ?? 0);
    }
    dispatchedForOrder(orderId) {
        return safe(this.db
            .select({ value: sum(crmShipmentLines.dispatched_qty).mapWith(Number) })
            .from(crmShipmentLines)
            .where(eq(crmShipmentLines.order_id, orderId))
            .get()?.value ?? 0);
    }
    findInOrder(id, orderId) {
        return this.db
            .select()
            .from(crmShipmentLines)
            .where(and(eq(crmShipmentLines.id, id), eq(crmShipmentLines.order_id, orderId)))
            .get();
    }
    dispatchedForOrderDocuments(orderId) {
        return this.db
            .select()
            .from(crmShipments)
            .where(and(eq(crmShipments.order_id, orderId), isNotNull(crmShipments.dispatched_at)))
            .orderBy(insertionOrder(crmShipments))
            .all();
    }
    loadingForLine(lineKey) {
        return safe(this.db
            .select({ value: sum(crmShipmentLines.loaded_qty).mapWith(Number) })
            .from(crmShipmentLines)
            .innerJoin(crmShipments, eq(crmShipments.id, crmShipmentLines.shipment_id))
            .where(and(eq(crmShipmentLines.line_key, lineKey), eq(crmShipments.status, 'LOADING')))
            .get()?.value ?? 0);
    }
    deliveredForLine(lineKey) {
        return safe(this.db
            .select({ value: sum(crmDeliveries.qty).mapWith(Number) })
            .from(crmDeliveries)
            .innerJoin(crmShipmentLines, eq(crmShipmentLines.id, crmDeliveries.shipment_line_id))
            .where(eq(crmShipmentLines.line_key, lineKey))
            .get()?.value ?? 0);
    }
    forOrder(orderId) {
        return this.db
            .select()
            .from(crmShipments)
            .where(eq(crmShipments.order_id, orderId))
            .orderBy(insertionOrder(crmShipments))
            .all();
    }
    pricedDeliveriesForCustomer(customerId) {
        return this.db
            .select({
            id: crmDeliveries.id,
            qty: crmDeliveries.qty,
            unit_price_paise: crmShipmentLines.unit_price_paise,
        })
            .from(crmDeliveries)
            .innerJoin(crmShipmentLines, eq(crmShipmentLines.id, crmDeliveries.shipment_line_id))
            .innerJoin(crmOrders, eq(crmOrders.id, crmDeliveries.order_id))
            .where(eq(crmOrders.customer_id, customerId))
            .orderBy(insertionOrder(crmDeliveries))
            .all();
    }
    correctionsForCustomer(customerId) {
        return this.db
            .select(getTableColumns(crmCorrections))
            .from(crmCorrections)
            .innerJoin(crmOrders, eq(crmOrders.id, crmCorrections.order_id))
            .where(eq(crmOrders.customer_id, customerId))
            .orderBy(insertionOrder(crmCorrections))
            .all();
    }
    insertShipment(c, row) {
        this.db.insert(crmShipments).values(row).run();
        recordInsert(c, 'shipments', row, false);
    }
    updateShipment(c, id, patch) {
        const before = this.db
            .select()
            .from(crmShipments)
            .where(eq(crmShipments.id, id))
            .get();
        if (!before)
            fail('NOT_FOUND', 'Record not found');
        this.db
            .update(crmShipments)
            .set(patch)
            .where(eq(crmShipments.id, id))
            .run();
        recordUpdate(c, 'shipments', before, { ...before, ...patch });
    }
    insertShipmentLine(c, row) {
        this.db.insert(crmShipmentLines).values(row).run();
        recordInsert(c, 'shipment_lines', row, false);
    }
    updateShipmentLine(c, id, patch) {
        const before = this.db
            .select()
            .from(crmShipmentLines)
            .where(eq(crmShipmentLines.id, id))
            .get();
        if (!before)
            fail('NOT_FOUND', 'Record not found');
        this.db
            .update(crmShipmentLines)
            .set(patch)
            .where(eq(crmShipmentLines.id, id))
            .run();
        recordUpdate(c, 'shipment_lines', before, { ...before, ...patch });
    }
    insertDelivery(c, row) {
        this.db.insert(crmDeliveries).values(row).run();
        recordInsert(c, 'deliveries', row, false);
    }
    insertCorrection(c, row) {
        this.db.insert(crmCorrections).values(row).run();
        recordInsert(c, 'corrections', row, false);
    }
};
FulfillmentRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], FulfillmentRepository);
export { FulfillmentRepository };
let FulfillmentRepositoryModule = class FulfillmentRepositoryModule {
};
FulfillmentRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [FulfillmentRepository],
        exports: [FulfillmentRepository],
    })
], FulfillmentRepositoryModule);
export { FulfillmentRepositoryModule };
//# sourceMappingURL=fulfillment.repository.js.map