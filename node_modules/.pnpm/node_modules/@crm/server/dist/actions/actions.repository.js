var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, Module } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { crmActionRequests } from '../actions/actions.model.js';
let ActionsRepository = class ActionsRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    get db() {
        return this.database.db;
    }
    findRequest(requesterId, key) {
        return this.db
            .select()
            .from(crmActionRequests)
            .where(and(eq(crmActionRequests.requester_id, requesterId), eq(crmActionRequests.idempotency_key, key)))
            .get();
    }
    findAction(id) {
        return this.db
            .select()
            .from(crmActionRequests)
            .where(eq(crmActionRequests.id, id))
            .get();
    }
    saveRequest(row) {
        this.db.insert(crmActionRequests).values(row).run();
    }
};
ActionsRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], ActionsRepository);
export { ActionsRepository };
let ActionsRepositoryModule = class ActionsRepositoryModule {
};
ActionsRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [ActionsRepository],
        exports: [ActionsRepository],
    })
], ActionsRepositoryModule);
export { ActionsRepositoryModule };
//# sourceMappingURL=actions.repository.js.map