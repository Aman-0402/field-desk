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
import { and, eq, gt, lte } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { sessions } from './auth.model.js';
let AuthRepository = class AuthRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    createSession(record, now) {
        this.database.db.transaction((tx) => {
            tx.delete(sessions).where(lte(sessions.expiresAt, now)).run();
            tx.insert(sessions).values(record).run();
        });
    }
    validSession(id, userId, now) {
        return this.database.db
            .select()
            .from(sessions)
            .where(and(eq(sessions.id, id), eq(sessions.userId, userId), gt(sessions.expiresAt, now)))
            .get();
    }
    deleteSession(id) {
        this.database.db.delete(sessions).where(eq(sessions.id, id)).run();
    }
};
AuthRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], AuthRepository);
export { AuthRepository };
let AuthRepositoryModule = class AuthRepositoryModule {
};
AuthRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [AuthRepository],
        exports: [AuthRepository],
    })
], AuthRepositoryModule);
export { AuthRepositoryModule };
//# sourceMappingURL=auth.repository.js.map