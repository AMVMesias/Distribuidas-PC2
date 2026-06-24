import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

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
    jsonDocumentUrl: 'v3/api-docs',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
