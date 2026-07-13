import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiErrorFilter } from './common/api-error.filter';
import { validationExceptionFactory } from './common/validation-exception.factory';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: validationExceptionFactory,
  }));

  const config = new DocumentBuilder()
    .setTitle('Servicio de Tickets')
    .setDescription('Emisión, pago y cancelación de tickets de parqueadero. Acceso por Kong.')
    .setVersion('v1')
    .addServer('http://localhost:8000', 'Kong Gateway local')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
      'bearerAuth',
    )
    .addTag('tickets')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, document, {
    jsonDocumentUrl: 'v3/api-docs',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
