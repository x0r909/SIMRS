/**
 * @file main.ts
 * @path apps/backend/src/main.ts
 * @description Entry point backend: bootstrap NestJS, Swagger, helmet, versioning /v1.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import "reflect-metadata";

import { randomUUID } from "node:crypto";
import { networkInterfaces } from "node:os";

import { ClassSerializerInterceptor, Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/http/global-exception.filter";
import { ResponseInterceptor } from "./common/http/response.interceptor";
import { SystemLogsService } from "./modules/system-logs/system-logs.service";

/**
 * Membuat dan mengonfigurasi instance NestJS tanpa listen port.
 * Mengaktifkan: CORS, helmet, compression, URI versioning `/v1`,
 * ValidationPipe global, exception filter, response envelope, Swagger.
 */
export async function createNestApp() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);
  app.enableShutdownHooks();

  const corsOrigin = config.get<string[] | "*">("CORS_ORIGIN", "*");
  const corsCredentials = corsOrigin === "*" ? false : true;

  app.enableCors({
    origin: corsOrigin,
    credentials: corsCredentials
  });

  app.use(helmet());
  app.use(compression());

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector))
  );

  const swaggerPath = config.get<string>("SWAGGER_PATH", "docs");
  const docConfig = new DocumentBuilder()
    .setTitle("SIMRS API")
    .setDescription("SIMRS backend API")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: { persistAuthorization: true }
  });

  await app.init();
  return app;
}

function getLanAddresses(): string[] {
  const addresses: string[] = [];
  for (const interfaces of Object.values(networkInterfaces())) {
    for (const net of interfaces ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

/**
 * Menjalankan server HTTP pada `0.0.0.0:PORT` dan mencatat startup ke system log.
 * Entry point utama saat `node dist/main.js`.
 */
export async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await createNestApp();
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 4000);
  await app.listen(port, "0.0.0.0");

  const systemLogs = app.get(SystemLogsService);
  await systemLogs
    .create({
      level: "INFO",
      service: "backend",
      context: "bootstrap",
      message: `SIMRS API started on port ${port}`,
      requestId: randomUUID(),
      metadata: {
        event: "startup",
        port,
        env: config.get<string>("NODE_ENV", "development"),
        host: "0.0.0.0",
        nodeVersion: process.version,
        pid: process.pid
      }
    })
    .catch(() => undefined);

  logger.log(`API listening on http://0.0.0.0:${port}/v1`);
  logger.log(`Swagger on http://localhost:${port}/${config.get<string>("SWAGGER_PATH", "docs")}`);

  const lanAddresses = getLanAddresses();
  if (lanAddresses.length > 0) {
    logger.log(`Akses LAN: ${lanAddresses.map((ip) => `http://${ip}:${port}/v1`).join(", ")}`);
  }
}

if (require.main === module) {
  bootstrap();
}

