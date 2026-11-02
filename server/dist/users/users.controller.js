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
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, } from '@nestjs/common';
import { createUserSchema, listUsersSchema, updateUserSchema, } from '@crm/shared/schemas';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import { ZodValidationPipe } from '../common/validation.pipe.js';
import { UsersService } from './users.service.js';
let UsersController = class UsersController {
    users;
    constructor(users) {
        this.users = users;
    }
    list(query) {
        return this.users.list(query);
    }
    async create(input) {
        return { user: await this.users.create(input) };
    }
    update(id, input, actor) {
        return { user: this.users.update(id, input, actor.id) };
    }
};
__decorate([
    Get(),
    __param(0, Query(new ZodValidationPipe(listUsersSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, Body(new ZodValidationPipe(createUserSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body(new ZodValidationPipe(updateUserSchema))),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
UsersController = __decorate([
    Roles('ADMIN'),
    Controller('users'),
    __metadata("design:paramtypes", [UsersService])
], UsersController);
export { UsersController };
//# sourceMappingURL=users.controller.js.map