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
import { count, eq, gt } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { insertionOrder } from '../database/query-order.js';
import { recordInsert } from '../common/domain.js';
import { crmBusinessEvents } from '../audit/audit.model.js';
let AuditRepository = class AuditRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    get db() {
        return this.database.db;
    }
    eventsForOrder(orderId) {
        return this.db
            .select()
            .from(crmBusinessEvents)
            .where(eq(crmBusinessEvents.order_id, orderId))
            .orderBy(insertionOrder(crmBusinessEvents))
            .all();
    }
    duplicateEvents(customerId) {
        return this.db
            .select({ actionId: crmBusinessEvents.action_id })
            .from(crmBusinessEvents)
            .where(eq(crmBusinessEvents.customer_id, customerId))
            .groupBy(crmBusinessEvents.action_id)
            .having(gt(count(), 1))
            .all().length;
    }
    eventsForCustomer(customerId) {
        return this.db
            .select()
            .from(crmBusinessEvents)
            .where(eq(crmBusinessEvents.customer_id, customerId))
            .orderBy(insertionOrder(crmBusinessEvents))
            .all();
    }
    insertEvent(c, row) {
        this.db.insert(crmBusinessEvents).values(row).run();
        recordInsert(c, 'business_events', row, true);
    }
};
AuditRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], AuditRepository);
export { AuditRepository };
let AuditRepositoryModule = class AuditRepositoryModule {
};
AuditRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [AuditRepository],
        exports: [AuditRepository],
    })
], AuditRepositoryModule);
export { AuditRepositoryModule };
//# sourceMappingURL=audit.repository.js.map