import "reflect-metadata";


import { ClassSerializerInterceptor, Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/http/global-exception.filter";
import { ResponseInterceptor } from "./common/http/response.interceptor";

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

export async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await createNestApp();
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 4000);
  await app.listen(port);

  logger.log(`API listening on http://localhost:${port}/v1`);
  logger.log(`Swagger on http://localhost:${port}/${config.get<string>("SWAGGER_PATH", "docs")}`);
}

if (require.main === module) {
  bootstrap();
}

