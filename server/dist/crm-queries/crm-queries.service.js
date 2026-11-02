var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CustomersRepository } from '../customers/customers.repository.js';
import { CatalogRepository } from '../catalog/catalog.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { OrdersService } from '../orders/orders.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { AuditService } from '../audit/audit.service.js';
let CrmQueriesService = class CrmQueriesService {
    database;
    customers;
    catalog;
    users;
    orders;
    accounts;
    audit;
    constructor(database, customers, catalog, users, orders, accounts, audit) {
        this.database = database;
        this.customers = customers;
        this.catalog = catalog;
        this.users = users;
        this.orders = orders;
        this.accounts = accounts;
        this.audit = audit;
    }
    bootstrap(user) {
        return this.database.db.transaction(() => ({
            customers: this.customers.list(),
            skus: this.catalog.list(),
            actors: user.role === 'ADMIN' ? this.users.listActive() : [user],
            orders: this.orders.list(),
        }));
    }
    snapshot(customerId) {
        return this.database.db.transaction(() => ({
            summary: this.accounts.summary(customerId),
            orders: this.orders.forCustomer(customerId),
            ledger: this.accounts.ledger(customerId),
            timeline: this.audit.customerTimeline(customerId),
            review: this.audit.review(customerId),
        }));
    }
};
CrmQueriesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService,
        CustomersRepository,
        CatalogRepository,
        UsersRepository,
        OrdersService,
        AccountsService,
        AuditService])
], CrmQueriesService);
export { CrmQueriesService };
//# sourceMappingURL=crm-queries.service.js.map