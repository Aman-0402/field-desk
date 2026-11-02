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
import { and, asc, eq, ne } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { recordInsert, recordUpdate, fail } from '../common/domain.js';
import { crmCustomers } from '../customers/customers.model.js';
let CustomersRepository = class CustomersRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    get db() {
        return this.database.db;
    }
    findById(id) {
        return this.db
            .select()
            .from(crmCustomers)
            .where(eq(crmCustomers.id, id))
            .get();
    }
    findOtherByCode(code, id) {
        return this.db
            .select()
            .from(crmCustomers)
            .where(and(eq(crmCustomers.code, code), ne(crmCustomers.id, id)))
            .get();
    }
    list() {
        return this.db
            .select()
            .from(crmCustomers)
            .orderBy(asc(crmCustomers.name))
            .all();
    }
    findByCode(code) {
        return this.db
            .select()
            .from(crmCustomers)
            .where(eq(crmCustomers.code, code))
            .get();
    }
    insertCustomer(c, row) {
        this.db.insert(crmCustomers).values(row).run();
        recordInsert(c, 'customers', row, false);
    }
    updateCustomer(c, id, patch) {
        const before = this.db
            .select()
            .from(crmCustomers)
            .where(eq(crmCustomers.id, id))
            .get();
        if (!before)
            fail('NOT_FOUND', 'Record not found');
        this.db
            .update(crmCustomers)
            .set(patch)
            .where(eq(crmCustomers.id, id))
            .run();
        recordUpdate(c, 'customers', before, { ...before, ...patch });
    }
};
CustomersRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], CustomersRepository);
export { CustomersRepository };
let CustomersRepositoryModule = class CustomersRepositoryModule {
};
CustomersRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [CustomersRepository],
        exports: [CustomersRepository],
    })
], CustomersRepositoryModule);
export { CustomersRepositoryModule };
//# sourceMappingURL=customers.repository.js.map