import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionesModule } from './asignaciones/asignaciones.module';
import { AssignmentAuditEvent } from './asignaciones/entities/assignment-audit-event.entity';
import { VehicleAssignment } from './asignaciones/entities/vehicle-assignment.entity';
import { InitialAsignacionesSchema1720000000000 } from './migrations/1720000000000-initial-asignaciones-schema';
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
        database: config.get('DB_NOMBRE', 'asignaciones'),
        entities: [VehicleAssignment, AssignmentAuditEvent],
        migrations: [InitialAsignacionesSchema1720000000000],
        migrationsRun: true,
        synchronize: false,
        logging: config.get('DB_LOGGING', 'false') === 'true',
      }),
      inject: [ConfigService],
    }),
    AsignacionesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
