import { Controller, Delete, ForbiddenException, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth-user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleAssignment } from './entities/vehicle-assignment.entity';
import { AssignmentAuditEvent } from './entities/assignment-audit-event.entity';
import { NotFoundException } from '@nestjs/common';

@ApiTags('root-asignaciones')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/root')
export class RootAsignacionesController {
  constructor(
    @InjectRepository(VehicleAssignment)
    private readonly assignments: Repository<VehicleAssignment>,
    @InjectRepository(AssignmentAuditEvent)
    private readonly auditEvents: Repository<AssignmentAuditEvent>,
  ) {}

  @Delete('asignaciones/:userId/:vehicleId')
  @ApiOperation({ summary: '[ROOT] Eliminar asignación físicamente' })
  @ApiResponse({ status: 200, description: 'Asignación eliminada físicamente' })
  @ApiResponse({ status: 403, description: 'Se requiere rol ROOT' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  async physicalDeleteAssignment(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user.roles.includes('ROOT')) {
      throw new ForbiddenException('Se requiere rol ROOT');
    }
    const assignment = await this.assignments.findOne({ where: { userId, vehicleId } });
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }
    // Delete related audit events first
    await this.auditEvents.delete({ userId, vehicleId });
    // Delete the assignment
    await this.assignments.remove(assignment);
    return { message: 'Asignación eliminada físicamente' };
  }
}
