var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { CustomersRepositoryModule } from '../customers/customers.repository.js';
import { OrdersRepositoryModule } from '../orders/orders.repository.js';
import { CatalogRepositoryModule } from '../catalog/catalog.repository.js';
import { FulfillmentRepositoryModule } from '../fulfillment/fulfillment.repository.js';
import { RewardsRepositoryModule } from '../rewards/rewards.repository.js';
import { RewardsModule } from '../rewards/rewards.module.js';
import { ReturnsRepositoryModule } from '../returns/returns.repository.js';
import { AuditRepositoryModule } from '../audit/audit.repository.js';
let OrdersModule = class OrdersModule {
};
OrdersModule = __decorate([
    Module({
        imports: [
            CustomersRepositoryModule,
            OrdersRepositoryModule,
            CatalogRepositoryModule,
            FulfillmentRepositoryModule,
            RewardsRepositoryModule,
            RewardsModule,
            ReturnsRepositoryModule,
            AuditRepositoryModule,
        ],
        controllers: [OrdersController],
        providers: [OrdersService],
        exports: [OrdersService],
    })
], OrdersModule);
export { OrdersModule };
//# sourceMappingURL=orders.module.js.map