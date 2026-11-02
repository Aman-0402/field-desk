var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
let DatabaseService = class DatabaseService {
    sqlite;
    db;
    constructor(config) {
        const path = config.get('DATABASE_PATH', { infer: true });
        if (path !== ':memory:')
            mkdirSync(dirname(resolve(path)), { recursive: true });
        this.sqlite = new Database(path);
        this.sqlite.pragma('journal_mode = WAL');
        this.sqlite.pragma('foreign_keys = ON');
        this.sqlite.pragma('busy_timeout = 5000');
        this.db = drizzle(this.sqlite, { schema });
    }
    onModuleDestroy() {
        this.sqlite.close();
    }
};
DatabaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], DatabaseService);
export { DatabaseService };
//# sourceMappingURL=database.service.js.map