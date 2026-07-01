import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalTokenGuard } from '../auth/internal-token.guard';
import { VehiculosService } from './vehiculos.service';

@ApiExcludeController()
@ApiTags('internal-vehiculos')
@Controller('api/v1/internal/vehiculos')
@UseGuards(InternalTokenGuard)
export class InternalVehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Consulta interna de vehículo sin filtrar por propietario legado' })
  findInternal(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiculosService.findInternalById(id);
  }

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Consulta interna de vehículo por placa' })
  findInternalByPlaca(@Param('placa') placa: string) {
    return this.vehiculosService.findInternalByPlaca(placa);
  }
}
