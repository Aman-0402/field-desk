import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
const app = await NestFactory.create(AppModule);
configureApp(app);
const config = app.get(ConfigService);
await app.listen(config.get('PORT', { infer: true }));
//# sourceMappingURL=main.js.map