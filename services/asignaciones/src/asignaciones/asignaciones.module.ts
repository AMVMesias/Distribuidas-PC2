import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AsignacionesController } from './asignaciones.controller';
import { AsignacionesService } from './asignaciones.service';
import { InternalClients } from './clients/internal-clients';
import { AssignmentAuditEvent } from './entities/assignment-audit-event.entity';
import { VehicleAssignment } from './entities/vehicle-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleAssignment, AssignmentAuditEvent]), PassportModule],
  controllers: [AsignacionesController],
  providers: [AsignacionesService, InternalClients, JwtStrategy],
})
export class AsignacionesModule {}
