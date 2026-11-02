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
import { eq, sum } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { insertionOrder } from '../database/query-order.js';
import { safe, recordInsert } from '../common/domain.js';
import { crmShipmentLines } from '../fulfillment/fulfillment.model.js';
import { crmReturns, crmReturnLines } from '../returns/returns.model.js';
let ReturnsRepository = class ReturnsRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    get db() {
        return this.database.db;
    }
    returnedForLine(lineKey) {
        return safe(this.db
            .select({ value: sum(crmReturnLines.qty).mapWith(Number) })
            .from(crmReturnLines)
            .innerJoin(crmShipmentLines, eq(crmShipmentLines.id, crmReturnLines.shipment_line_id))
            .where(eq(crmShipmentLines.line_key, lineKey))
            .get()?.value ?? 0);
    }
    returnedForShipmentLine(lineId) {
        return safe(this.db
            .select({ value: sum(crmReturnLines.qty).mapWith(Number) })
            .from(crmReturnLines)
            .where(eq(crmReturnLines.shipment_line_id, lineId))
            .get()?.value ?? 0);
    }
    grossForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmReturns.gross_paise).mapWith(Number) })
            .from(crmReturns)
            .where(eq(crmReturns.customer_id, customerId))
            .get()?.value ?? 0);
    }
    feesForCustomer(customerId) {
        return safe(this.db
            .select({ value: sum(crmReturns.fee_paise).mapWith(Number) })
            .from(crmReturns)
            .where(eq(crmReturns.customer_id, customerId))
            .get()?.value ?? 0);
    }
    forCustomer(customerId) {
        return this.db
            .select()
            .from(crmReturns)
            .where(eq(crmReturns.customer_id, customerId))
            .orderBy(insertionOrder(crmReturns))
            .all();
    }
    insertReturn(c, row) {
        this.db.insert(crmReturns).values(row).run();
        recordInsert(c, 'returns', row, false);
    }
    insertReturnLine(c, row) {
        this.db.insert(crmReturnLines).values(row).run();
        recordInsert(c, 'return_lines', row, false);
    }
};
ReturnsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], ReturnsRepository);
export { ReturnsRepository };
let ReturnsRepositoryModule = class ReturnsRepositoryModule {
};
ReturnsRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [ReturnsRepository],
        exports: [ReturnsRepository],
    })
], ReturnsRepositoryModule);
export { ReturnsRepositoryModule };
//# sourceMappingURL=returns.repository.js.map