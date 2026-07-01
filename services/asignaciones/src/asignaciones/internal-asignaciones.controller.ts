import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalTokenGuard } from '../auth/internal-token.guard';
import { AsignacionesService } from './asignaciones.service';

@ApiExcludeController()
@ApiTags('internal-asignaciones')
@Controller('api/v1/internal/asignaciones')
@UseGuards(InternalTokenGuard)
export class InternalAsignacionesController {
  constructor(private readonly service: AsignacionesService) {}

  @Get('vehiculos/:vehicleId/activa')
  @ApiOperation({ summary: 'Consulta interna de propietario activo por vehículo' })
  findActiveByVehicle(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.service.findActiveByVehicleInternal(vehicleId);
  }
}
