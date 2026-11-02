var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ForbiddenException, NotFoundException, ConflictException, } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CustomersRepository } from '../customers/customers.repository.js';
import { DatabaseService } from '../database/database.service.js';
import { useCustomer, fail } from '../common/domain.js';
let CustomersService = class CustomersService {
    customersRepository;
    database;
    constructor(customersRepository, database) {
        this.customersRepository = customersRepository;
        this.database = database;
    }
    updateCustomer(c, p) {
        useCustomer(c, this.customersRepository.findById(p.customerId));
        if (this.customersRepository.findOtherByCode(p.code, p.customerId))
            fail('CUSTOMER_CODE_EXISTS', 'Another customer already uses this code');
        this.customersRepository.updateCustomer(c, p.customerId, {
            name: p.name,
            code: p.code,
        });
    }
    createCustomer(user, input) {
        if (!['ADMIN', 'SALES', 'ACCOUNTS'].includes(user.role))
            throw new ForbiddenException('This role cannot create customers');
        return this.database.db.transaction(() => {
            const c = {
                id: randomUUID(),
                actor: user,
                requester: user,
                now: new Date().toISOString(),
                customerId: randomUUID(),
                touched: new Set(),
                effects: [],
                references: {},
            };
            if (this.customersRepository.findByCode(input.code))
                throw new ConflictException('Customer code already exists');
            this.customersRepository.insertCustomer(c, {
                id: c.customerId,
                name: input.name,
                code: input.code,
                version: 0,
            });
            return this.customersRepository.findById(c.customerId);
        }, { behavior: 'immediate' });
    }
    findById(id) {
        const customer = this.customersRepository.findById(id);
        if (!customer)
            throw new NotFoundException('Customer not found');
        return customer;
    }
};
CustomersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [CustomersRepository,
        DatabaseService])
], CustomersService);
export { CustomersService };
//# sourceMappingURL=customers.service.js.map