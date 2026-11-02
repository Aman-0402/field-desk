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
import { Controller, Get } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import { workspaceDescriptions } from './workspace.model.js';
let WorkspaceController = class WorkspaceController {
    sales(user) {
        return { ...workspaceDescriptions.sales, role: user.role };
    }
    accounts(user) {
        return { ...workspaceDescriptions.accounts, role: user.role };
    }
};
__decorate([
    Get('sales'),
    Roles('SALES', 'ADMIN'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "sales", null);
__decorate([
    Get('accounts'),
    Roles('KAM', 'ADMIN'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspaceController.prototype, "accounts", null);
WorkspaceController = __decorate([
    Controller('workspace')
], WorkspaceController);
export { WorkspaceController };
//# sourceMappingURL=workspace.controller.js.map