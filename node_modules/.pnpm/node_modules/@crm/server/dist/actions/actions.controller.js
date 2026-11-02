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
import { Body, Controller, Post } from '@nestjs/common';
import { ActionsService } from './actions.service.js';
import { CurrentUser } from '../auth/auth.decorators.js';
import { ZodValidationPipe } from '../common/validation.pipe.js';
import { actionEnvelopeSchema } from '@crm/shared/crm';
let ActionsController = class ActionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    execute(input, user) {
        return this.service.execute(input, user);
    }
};
__decorate([
    Post(),
    __param(0, Body(new ZodValidationPipe(actionEnvelopeSchema))),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ActionsController.prototype, "execute", null);
ActionsController = __decorate([
    Controller('crm/actions'),
    __metadata("design:paramtypes", [ActionsService])
], ActionsController);
export { ActionsController };
//# sourceMappingURL=actions.controller.js.map