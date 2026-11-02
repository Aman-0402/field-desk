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
import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { CurrentUser } from '../auth/auth.decorators.js';
let AuditController = class AuditController {
    service;
    constructor(service) {
        this.service = service;
    }
    orderTimeline(id) {
        return this.service.orderTimeline(id);
    }
    customerTimeline(id) {
        return this.service.customerTimeline(id);
    }
    review(id) {
        return this.service.review(id);
    }
    trace(id, user) {
        return this.service.trace(id, user);
    }
};
__decorate([
    Get('orders/:id/timeline'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "orderTimeline", null);
__decorate([
    Get('customers/:id/timeline'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "customerTimeline", null);
__decorate([
    Get('customers/:id/review'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "review", null);
__decorate([
    Get('actions/:id/trace'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "trace", null);
AuditController = __decorate([
    Controller('crm'),
    __metadata("design:paramtypes", [AuditService])
], AuditController);
export { AuditController };
//# sourceMappingURL=audit.controller.js.map