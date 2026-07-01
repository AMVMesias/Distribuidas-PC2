import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsModule } from './tickets/tickets.module';
import { Ticket } from './tickets/entities/ticket.entity';
import { InitialTicketsSchema1730000000000 } from './migrations/1730000000000-initial-tickets-schema';
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
        database: config.get('DB_NOMBRE', 'tickets'),
        entities: [Ticket],
        migrations: [InitialTicketsSchema1730000000000],
        migrationsRun: true,
        synchronize: false,
        logging: config.get('DB_LOGGING', 'false') === 'true',
      }),
      inject: [ConfigService],
    }),
    TicketsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
