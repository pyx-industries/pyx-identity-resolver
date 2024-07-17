import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validationExceptionFactory } from './common/factories/validation-exception.factory';

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

  const config = new DocumentBuilder()
    .setTitle('Link resolver API')
    .setDescription('The link resolver API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

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
