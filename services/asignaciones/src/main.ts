import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiErrorFilter } from './common/api-error.filter';
import { validationExceptionFactory } from './common/validation-exception.factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: validationExceptionFactory,
  }));

  const config = new DocumentBuilder()
    .setTitle('Servicio de Asignación y Trazabilidad')
    .setDescription('Asignación de vehículos a propietarios y trazabilidad histórica. Acceso por Kong.')
    .setVersion('v1')
    .addServer('http://localhost:8000', 'Kong Gateway local')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
      'bearerAuth',
    )
    .addTag('asignaciones')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, document, {
    explorer: true,
    jsonDocumentUrl: 'v3/api-docs',
    customSiteTitle: 'Gateway Distribuidas API Docs',
    swaggerOptions: {
      urls: [
        { name: 'Asignaciones', url: '/asignaciones/v3/api-docs' },
        { name: 'Usuarios', url: '/usuarios/v3/api-docs' },
        { name: 'Vehículos', url: '/vehiculos/v3/api-docs' },
        { name: 'Zonas', url: '/zonas/v3/api-docs' },
        { name: 'Tickets', url: '/tickets/v3/api-docs' },
      ],
      urlsPrimaryName: 'Asignaciones',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
