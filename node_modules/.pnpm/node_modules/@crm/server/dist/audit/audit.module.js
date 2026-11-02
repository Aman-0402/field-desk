var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';
import { AccountsRepositoryModule } from '../accounts/accounts.repository.js';
import { OrdersRepositoryModule } from '../orders/orders.repository.js';
import { FulfillmentRepositoryModule } from '../fulfillment/fulfillment.repository.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { RewardsRepositoryModule } from '../rewards/rewards.repository.js';
import { ReturnsRepositoryModule } from '../returns/returns.repository.js';
import { CreditsRepositoryModule } from '../credits/credits.repository.js';
import { AuditRepositoryModule } from '../audit/audit.repository.js';
import { ActionsRepositoryModule } from '../actions/actions.repository.js';
let AuditModule = class AuditModule {
};
AuditModule = __decorate([
    Module({
        imports: [
            AccountsRepositoryModule,
            OrdersRepositoryModule,
            FulfillmentRepositoryModule,
            AccountsModule,
            OrdersModule,
            RewardsRepositoryModule,
            ReturnsRepositoryModule,
            CreditsRepositoryModule,
            AuditRepositoryModule,
            ActionsRepositoryModule,
        ],
        controllers: [AuditController],
        providers: [AuditService],
        exports: [AuditService],
    })
], AuditModule);
export { AuditModule };
//# sourceMappingURL=audit.module.js.map