var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service.js';
import { FulfillmentController } from './fulfillment.controller.js';
import { OrdersRepositoryModule } from '../orders/orders.repository.js';
import { FulfillmentRepositoryModule } from '../fulfillment/fulfillment.repository.js';
import { AccountsRepositoryModule } from '../accounts/accounts.repository.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { RewardsModule } from '../rewards/rewards.module.js';
import { CatalogRepositoryModule } from '../catalog/catalog.repository.js';
import { ReturnsRepositoryModule } from '../returns/returns.repository.js';
let FulfillmentModule = class FulfillmentModule {
};
FulfillmentModule = __decorate([
    Module({
        imports: [
            OrdersRepositoryModule,
            FulfillmentRepositoryModule,
            AccountsRepositoryModule,
            AccountsModule,
            RewardsModule,
            CatalogRepositoryModule,
            ReturnsRepositoryModule,
        ],
        controllers: [FulfillmentController],
        providers: [FulfillmentService],
        exports: [FulfillmentService],
    })
], FulfillmentModule);
export { FulfillmentModule };
//# sourceMappingURL=fulfillment.module.js.map