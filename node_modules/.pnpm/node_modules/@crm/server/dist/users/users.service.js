var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { PasswordService } from './password.service.js';
let UsersService = class UsersService {
    repository;
    passwords;
    constructor(repository, passwords) {
        this.repository = repository;
        this.passwords = passwords;
    }
    findForLogin(email) {
        return this.repository.findForLogin(email);
    }
    findById(id) {
        return this.repository.findById(id);
    }
    async create(input) {
        const passwordHash = await this.passwords.hash(input.password);
        const user = this.repository.insert({
            id: randomUUID(),
            name: input.name,
            email: input.email,
            passwordHash,
            role: input.role,
            createdAt: new Date().toISOString(),
        });
        if (!user)
            throw new ConflictException('An account with this email already exists');
        return user;
    }
    list(input) {
        return this.repository.list(input);
    }
    update(id, input, actorId) {
        if (id === actorId)
            throw new BadRequestException('Another admin must change your role or account status');
        return this.repository.transaction(() => {
            const current = this.repository.findById(id);
            if (!current)
                throw new NotFoundException('User not found');
            if (current.role === 'ADMIN' &&
                current.active &&
                ((input.role && input.role !== 'ADMIN') || input.active === false)) {
                if (this.repository.activeAdminCount() <= 1)
                    throw new ConflictException('At least one active admin is required');
            }
            const updated = this.repository.update(id, input);
            if (!updated)
                throw new NotFoundException('User not found');
            this.repository.revokeSessions(id);
            return updated;
        });
    }
};
UsersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UsersRepository,
        PasswordService])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map