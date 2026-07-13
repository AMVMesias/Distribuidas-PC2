import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../auth/jwt.strategy';
import { InternalTokenGuard } from '../auth/internal-token.guard';
import { AsignacionesController } from './asignaciones.controller';
import { InternalAsignacionesController } from './internal-asignaciones.controller';
import { RootAsignacionesController } from './root-asignaciones.controller';
import { AsignacionesService } from './asignaciones.service';
import { InternalClients } from './clients/internal-clients';
import { AssignmentAuditEvent } from './entities/assignment-audit-event.entity';
import { VehicleAssignment } from './entities/vehicle-assignment.entity';

import { EventPublisherService } from './event-publisher.service';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleAssignment, AssignmentAuditEvent]), PassportModule],
  controllers: [AsignacionesController, RootAsignacionesController, InternalAsignacionesController],
  providers: [AsignacionesService, InternalClients, JwtStrategy, InternalTokenGuard, EventPublisherService],
})
export class AsignacionesModule {}
