import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { Vehiculo } from './vehiculos/entities/vehiculo.entity';
import { Auto } from './vehiculos/entities/auto.entity';
import { Motocicleta } from './vehiculos/entities/motocicleta.entity';
import { Camioneta } from './vehiculos/entities/camioneta.entity';
import { InitialSchema1719000000000 } from './migrations/1719000000000-initial-schema';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USUARIO', 'postgres'),
        password: config.get('DB_CONTRASENA', 'postgres'),
        database: config.get('DB_NOMBRE', 'gestion_vehiculos'),
        entities: [Vehiculo, Auto, Motocicleta, Camioneta],
        migrations: [InitialSchema1719000000000],
        migrationsRun: true,
        synchronize: false,
        logging: config.get('DB_LOGGING', 'false') === 'true',
      }),
      inject: [ConfigService],
    }),
    VehiculosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
