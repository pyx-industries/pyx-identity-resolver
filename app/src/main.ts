import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validationExceptionFactory } from './common/factories/validation-exception.factory';
import { API_VERSION, APP_ROUTE_PREFIX } from './common/utils/config.utils';

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
    }),
  );
  app.use(helmet());

  app.setGlobalPrefix(APP_ROUTE_PREFIX);

  const config = new DocumentBuilder()
    .setTitle('Link resolver API')
    .setDescription('The link resolver API description')
    .setVersion(API_VERSION)
    .addBearerAuth()
    .addServer(
      `${process.env.API_BASE_URL || 'http://localhost:3000'}${APP_ROUTE_PREFIX}`,
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Optional: You can also transform the document to remove prefixes
  document.paths = Object.entries(document.paths).reduce(
    (acc, [path, value]) => {
      const newPath = path.replace(`/api/${API_VERSION}`, '');
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
