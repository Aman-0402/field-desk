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
import { AccountsService } from './accounts.service.js';
let AccountsController = class AccountsController {
    service;
    constructor(service) {
        this.service = service;
    }
    accounts() {
        return this.service.accounts();
    }
    summary(id) {
        return this.service.summary(id);
    }
    ledger(id) {
        return this.service.ledger(id);
    }
};
__decorate([
    Get('accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "accounts", null);
__decorate([
    Get('customers/:id/summary'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "summary", null);
__decorate([
    Get('customers/:id/ledger'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "ledger", null);
AccountsController = __decorate([
    Controller('crm'),
    __metadata("design:paramtypes", [AccountsService])
], AccountsController);
export { AccountsController };
//# sourceMappingURL=accounts.controller.js.map