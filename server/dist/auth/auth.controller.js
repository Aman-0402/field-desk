var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, HttpCode, Post, Req, Res, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { loginSchema, registerSchema } from '@crm/shared/schemas';
import { ZodValidationPipe } from '../common/validation.pipe.js';
import { AuthService } from './auth.service.js';
import { CurrentUser, Public } from './auth.decorators.js';
import { cookieOptions, SESSION_COOKIE } from './session-cookie.js';
let AuthController = class AuthController {
    auth;
    config;
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    async login(input, response) {
        return this.setSession(await this.auth.login(input), response);
    }
    async register(input, response) {
        return this.setSession(await this.auth.register(input), response);
    }
    me(user) {
        return { user };
    }
    logout(request, response) {
        this.auth.logout(request.sessionId);
        response.clearCookie(SESSION_COOKIE, cookieOptions(this.config));
    }
    setSession(session, response) {
        response.cookie(SESSION_COOKIE, session.token, {
            ...cookieOptions(this.config),
            maxAge: this.config.get('SESSION_TTL_SECONDS', { infer: true }) * 1000,
        });
        return { user: session.user };
    }
};
__decorate([
    Public(),
    Post('login'),
    HttpCode(200),
    Throttle({ default: { limit: 10, ttl: 60000 } }),
    __param(0, Body(new ZodValidationPipe(loginSchema))),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Public(),
    Post('register'),
    Throttle({ default: { limit: 5, ttl: 60000 } }),
    __param(0, Body(new ZodValidationPipe(registerSchema))),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    Get('me'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    Post('logout'),
    HttpCode(204),
    __param(0, Req()),
    __param(1, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
AuthController = __decorate([
    Controller('auth'),
    __metadata("design:paramtypes", [AuthService,
        ConfigService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map