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
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository.js';
import { UsersService } from '../users/users.service.js';
import { PasswordService } from '../users/password.service.js';
let AuthService = class AuthService {
    users;
    passwords;
    repository;
    jwt;
    config;
    constructor(users, passwords, repository, jwt, config) {
        this.users = users;
        this.passwords = passwords;
        this.repository = repository;
        this.jwt = jwt;
        this.config = config;
    }
    async login(input) {
        const user = this.users.findForLogin(input.email);
        const matches = await this.passwords.verify(input.password, user?.passwordHash);
        if (!user || !matches || !user.active)
            throw new UnauthorizedException('Invalid email or password');
        const publicUser = this.users.findById(user.id);
        if (!publicUser)
            throw new UnauthorizedException('Invalid email or password');
        return this.createSession(publicUser);
    }
    async register(input) {
        const user = await this.users.create({ ...input, role: 'SALES' });
        return this.createSession(user);
    }
    async createSession(user) {
        const sessionId = randomUUID();
        const ttl = this.config.get('SESSION_TTL_SECONDS', { infer: true });
        const token = await this.jwt.signAsync({}, { subject: user.id, jwtid: sessionId, expiresIn: ttl });
        const now = Math.floor(Date.now() / 1000);
        this.repository.createSession({ id: sessionId, userId: user.id, expiresAt: now + ttl }, now);
        return { token, user };
    }
    async authenticate(token) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(token);
        }
        catch {
            throw new UnauthorizedException('Your session has expired. Sign in again.');
        }
        if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string')
            throw new UnauthorizedException('Invalid session');
        const session = this.repository.validSession(payload.jti, payload.sub, Math.floor(Date.now() / 1000));
        const user = session ? this.users.findById(session.userId) : undefined;
        if (!session || !user?.active)
            throw new UnauthorizedException('Your session has expired. Sign in again.');
        return { user, sessionId: session.id };
    }
    logout(sessionId) {
        this.repository.deleteSession(sessionId);
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UsersService,
        PasswordService,
        AuthRepository,
        JwtService,
        ConfigService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map