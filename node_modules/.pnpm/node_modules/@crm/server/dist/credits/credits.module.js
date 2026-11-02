var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service.js';
import { CreditsController } from './credits.controller.js';
import { CustomersRepositoryModule } from '../customers/customers.repository.js';
import { AccountsRepositoryModule } from '../accounts/accounts.repository.js';
import { CreditsRepositoryModule } from '../credits/credits.repository.js';
import { RewardsRepositoryModule } from '../rewards/rewards.repository.js';
let CreditsModule = class CreditsModule {
};
CreditsModule = __decorate([
    Module({
        imports: [
            CustomersRepositoryModule,
            AccountsRepositoryModule,
            CreditsRepositoryModule,
            RewardsRepositoryModule,
        ],
        controllers: [CreditsController],
        providers: [CreditsService],
        exports: [CreditsService],
    })
], CreditsModule);
export { CreditsModule };
//# sourceMappingURL=credits.module.js.map