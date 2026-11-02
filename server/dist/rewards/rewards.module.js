var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { RewardsService } from './rewards.service.js';
import { RewardsController } from './rewards.controller.js';
import { CustomersRepositoryModule } from '../customers/customers.repository.js';
import { RewardsRepositoryModule } from '../rewards/rewards.repository.js';
import { AccountsRepositoryModule } from '../accounts/accounts.repository.js';
import { CreditsRepositoryModule } from '../credits/credits.repository.js';
import { OrdersRepositoryModule } from '../orders/orders.repository.js';
import { ReturnsRepositoryModule } from '../returns/returns.repository.js';
let RewardsModule = class RewardsModule {
};
RewardsModule = __decorate([
    Module({
        imports: [
            CustomersRepositoryModule,
            RewardsRepositoryModule,
            AccountsRepositoryModule,
            CreditsRepositoryModule,
            OrdersRepositoryModule,
            ReturnsRepositoryModule,
        ],
        controllers: [RewardsController],
        providers: [RewardsService],
        exports: [RewardsService],
    })
], RewardsModule);
export { RewardsModule };
//# sourceMappingURL=rewards.module.js.map