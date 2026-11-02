var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { AuthRepositoryModule } from './auth.repository.js';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
        imports: [
            AuthRepositoryModule,
            UsersModule,
            JwtModule.registerAsync({
                inject: [ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET', { infer: true }),
                    signOptions: {
                        algorithm: 'HS256',
                        issuer: 'crm-workspace',
                        audience: 'crm-client',
                    },
                    verifyOptions: {
                        algorithms: ['HS256'],
                        issuer: 'crm-workspace',
                        audience: 'crm-client',
                    },
                }),
            }),
        ],
        controllers: [AuthController],
        providers: [AuthService],
        exports: [AuthService],
    })
], AuthModule);
export { AuthModule };
//# sourceMappingURL=auth.module.js.map