var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { ALLOWED_ROLES, PUBLIC_ROUTE } from './auth.decorators.js';
import { SESSION_COOKIE } from './session-cookie.js';
let AuthGuard = class AuthGuard {
    reflector;
    auth;
    constructor(reflector, auth) {
        this.reflector = reflector;
        this.auth = auth;
    }
    async canActivate(context) {
        if (this.reflector.getAllAndOverride(PUBLIC_ROUTE, [
            context.getHandler(),
            context.getClass(),
        ]))
            return true;
        const request = context.switchToHttp().getRequest();
        const cookies = request.cookies;
        const token = cookies?.[SESSION_COOKIE];
        if (typeof token !== 'string')
            throw new UnauthorizedException('Sign in to continue');
        const session = await this.auth.authenticate(token);
        request.user = session.user;
        request.sessionId = session.sessionId;
        return true;
    }
};
AuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector,
        AuthService])
], AuthGuard);
export { AuthGuard };
let RolesGuard = class RolesGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const roles = this.reflector.getAllAndOverride(ALLOWED_ROLES, [
            context.getHandler(),
            context.getClass(),
        ]);
        return (!roles ||
            roles.includes(context.switchToHttp().getRequest().user.role));
    }
};
RolesGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector])
], RolesGuard);
export { RolesGuard };
//# sourceMappingURL=auth.guards.js.map