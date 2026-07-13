import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AutoDto, CamionetaDto, MotocicletaDto } from './vehiculos/dto/create-vehiculo.dto';
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
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [AutoDto, MotocicletaDto, CamionetaDto],
  });
  SwaggerModule.setup('swagger-ui', app, document, {
    jsonDocumentUrl: 'v3/api-docs',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
