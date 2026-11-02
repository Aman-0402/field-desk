var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { CurrentUser } from '../auth/auth.decorators.js';
import { ZodValidationPipe } from '../common/validation.pipe.js';
import { z } from 'zod';
const customerSchema = z
    .object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(2).max(40),
})
    .strict();
let CustomersController = class CustomersController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(input, user) {
        return this.service.createCustomer(user, input);
    }
    find(id) {
        return this.service.findById(id);
    }
};
__decorate([
    Post(),
    __param(0, Body(new ZodValidationPipe(customerSchema))),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "create", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "find", null);
CustomersController = __decorate([
    Controller('crm/customers'),
    __metadata("design:paramtypes", [CustomersService])
], CustomersController);
export { CustomersController };
//# sourceMappingURL=customers.controller.js.map