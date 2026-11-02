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
import { and, asc, count, eq, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { users, publicUserColumns } from './users.model.js';
import { sessions } from '../auth/auth.model.js';
let UsersRepository = class UsersRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    findForLogin(email) {
        return this.database.db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .get();
    }
    findById(id) {
        return this.database.db
            .select(publicUserColumns)
            .from(users)
            .where(eq(users.id, id))
            .get();
    }
    listActive() {
        return this.database.db
            .select(publicUserColumns)
            .from(users)
            .where(eq(users.active, true))
            .orderBy(asc(users.name))
            .all();
    }
    insert(input) {
        return this.database.db
            .insert(users)
            .values(input)
            .onConflictDoNothing({ target: users.email })
            .returning(publicUserColumns)
            .get();
    }
    list(input) {
        const term = input.search.toLowerCase();
        const filter = term
            ? or(sql `instr(lower(${users.name}), ${term}) > 0`, sql `instr(${users.email}, ${term}) > 0`)
            : undefined;
        const total = this.database.db
            .select({ value: count() })
            .from(users)
            .where(filter)
            .get()?.value ?? 0;
        const records = this.database.db
            .select(publicUserColumns)
            .from(users)
            .where(filter)
            .orderBy(asc(users.createdAt), asc(users.id))
            .limit(input.pageSize)
            .offset((input.page - 1) * input.pageSize)
            .all();
        return {
            users: records,
            total,
            page: input.page,
            pageSize: input.pageSize,
        };
    }
    activeAdminCount() {
        return (this.database.db
            .select({ value: count() })
            .from(users)
            .where(and(eq(users.role, 'ADMIN'), eq(users.active, true)))
            .get()?.value ?? 0);
    }
    update(id, input) {
        return this.database.db
            .update(users)
            .set(input)
            .where(eq(users.id, id))
            .returning(publicUserColumns)
            .get();
    }
    revokeSessions(userId) {
        this.database.db.delete(sessions).where(eq(sessions.userId, userId)).run();
    }
    transaction(work) {
        return this.database.db.transaction(work, { behavior: 'immediate' });
    }
};
UsersRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], UsersRepository);
export { UsersRepository };
let UsersRepositoryModule = class UsersRepositoryModule {
};
UsersRepositoryModule = __decorate([
    Module({
        imports: [DatabaseModule],
        providers: [UsersRepository],
        exports: [UsersRepository],
    })
], UsersRepositoryModule);
export { UsersRepositoryModule };
//# sourceMappingURL=users.repository.js.map