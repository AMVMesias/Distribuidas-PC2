import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Servicio de Vehículos')
    .setDescription('Gestión de vehículos. Acceso a través de Kong en http://localhost:8000. La propiedad oficial vehículo-propietario se administra en el servicio de asignaciones; ownerId queda como compatibilidad legado.')
    .setVersion('v1')
    .addServer('http://localhost:8000', 'Kong Gateway local')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
      'bearerAuth',
    )
    .addTag('vehiculos')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, document, {
    jsonDocumentUrl: 'v3/api-docs',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
