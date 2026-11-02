var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
const parameters = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function derive(password, salt) {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, parameters, (error, key) => error ? reject(error) : resolve(key));
    });
}
let PasswordService = class PasswordService {
    dummyHash = this.hash(randomBytes(32).toString('hex'));
    async hash(password) {
        const salt = randomBytes(16);
        const key = await derive(password, salt);
        return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
    }
    async verify(password, hash) {
        // Unknown accounts perform the same expensive password verification.
        const [, saltHex, keyHex] = (hash ?? (await this.dummyHash)).split('$');
        if (!saltHex || !keyHex)
            return false;
        const key = await derive(password, Buffer.from(saltHex, 'hex'));
        const expected = Buffer.from(keyHex, 'hex');
        return (expected.length === key.length &&
            timingSafeEqual(expected, key) &&
            hash !== undefined);
    }
};
PasswordService = __decorate([
    Injectable()
], PasswordService);
export { PasswordService };
//# sourceMappingURL=password.service.js.map