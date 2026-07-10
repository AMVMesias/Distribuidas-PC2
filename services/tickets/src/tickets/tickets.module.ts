import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { Ticket } from './entities/ticket.entity';
import { InternalClients } from './clients/internal-clients';
import { EventPublisherService } from './event-publisher.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), PassportModule],
  controllers: [TicketsController],
  providers: [TicketsService, InternalClients, JwtStrategy, RolesGuard, EventPublisherService],
})
export class TicketsModule {}
