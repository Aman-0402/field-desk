var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import 'reflect-metadata';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { validateEnvironment } from '../config/environment.js';
import { DatabaseModule } from './database.module.js';
import { DatabaseService } from './database.service.js';
export const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));
let MigrationModule = class MigrationModule {
};
MigrationModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
            DatabaseModule,
        ],
    })
], MigrationModule);
export async function runMigrations() {
    const app = await NestFactory.createApplicationContext(MigrationModule, {
        logger: ['error', 'warn'],
    });
    try {
        migrate(app.get(DatabaseService).db, { migrationsFolder });
        console.log('Database migrations applied.');
    }
    finally {
        await app.close();
    }
}
if (process.argv[1] &&
    resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await runMigrations();
}
//# sourceMappingURL=migrate.js.map