import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validationExceptionFactory } from './common/factories/validation-exception.factory';
import {
  API_VERSION,
  APP_ROUTE_PREFIX,
  buildApiBaseUrl,
} from './common/utils/config.utils';

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      validateCustomDecorators: true,
      exceptionFactory: validationExceptionFactory,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.use(helmet());

  app.setGlobalPrefix(APP_ROUTE_PREFIX);

  // Swagger's "server" URL must reflect the externally-reachable
  // address of the deployment so that "Try it out" hits the right host
  // (not the internal container address). `buildApiBaseUrl` composes
  // `RESOLVER_DOMAIN` + `APP_ROUTE_PREFIX` once; downstream consumers
  // use the same helper so the Swagger server URL, linkset anchors,
  // Link response headers, and the resolver description file all
  // agree on the shape.
  const configService = app.get(ConfigService);
  const apiBaseUrl = buildApiBaseUrl(configService);
  const config = new DocumentBuilder()
    .setTitle('Link resolver API')
    .setDescription('The link resolver API description')
    .setVersion(API_VERSION)
    .addBearerAuth()
    .addServer(apiBaseUrl)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Strip the route prefix from each path so the Swagger UI presents the
  // resource paths cleanly under the chosen server (the prefix is already
  // encoded in `addServer`).
  document.paths = Object.entries(document.paths).reduce(
    (acc, [path, value]) => {
      const newPath = path.replace(APP_ROUTE_PREFIX, '');
      acc[newPath] = value;
      return acc;
    },
    {},
  );

  SwaggerModule.setup('api-docs', app, document);

  if (process.env.NODE_ENV === 'production') {
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    return serverlessExpress({ app: expressApp });
  } else {
    return await app.listen(process.env.PORT || 3000);
  }
}

if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

// Lambda handler function to bootstrap NestJS application
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};

// TODO: Add another functions for Google Cloud Functions and Azure Functions
