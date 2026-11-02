var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service.js';
import { ActionsController } from './actions.controller.js';
import { UsersRepositoryModule } from '../users/users.repository.js';
import { ActionsRepositoryModule } from '../actions/actions.repository.js';
import { OrdersRepositoryModule } from '../orders/orders.repository.js';
import { CustomersRepositoryModule } from '../customers/customers.repository.js';
import { CustomersModule } from '../customers/customers.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { FulfillmentModule } from '../fulfillment/fulfillment.module.js';
import { ReturnsModule } from '../returns/returns.module.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { RewardsModule } from '../rewards/rewards.module.js';
import { CreditsModule } from '../credits/credits.module.js';
import { AuditRepositoryModule } from '../audit/audit.repository.js';
import { AuditModule } from '../audit/audit.module.js';
let ActionsModule = class ActionsModule {
};
ActionsModule = __decorate([
    Module({
        imports: [
            UsersRepositoryModule,
            ActionsRepositoryModule,
            OrdersRepositoryModule,
            CustomersRepositoryModule,
            CustomersModule,
            OrdersModule,
            FulfillmentModule,
            ReturnsModule,
            AccountsModule,
            RewardsModule,
            CreditsModule,
            AuditRepositoryModule,
            AuditModule,
        ],
        controllers: [ActionsController],
        providers: [ActionsService],
        exports: [ActionsService],
    })
], ActionsModule);
export { ActionsModule };
//# sourceMappingURL=actions.module.js.map