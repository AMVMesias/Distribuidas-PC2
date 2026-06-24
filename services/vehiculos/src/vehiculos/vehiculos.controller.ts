import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { RespuestaVehiculoDto } from './dto/respuesta-vehiculo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedRequest } from '../auth/auth-user';

@ApiTags('vehiculos')
@ApiBearerAuth('bearerAuth')
@Controller('api/v1/vehiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear vehículo',
    description:
      'El ownerId se toma del claim sub del JWT y se conserva por compatibilidad. La propiedad oficial para la evaluación se administra en /api/v1/asignaciones.',
  })
  @ApiResponse({ status: 201, description: 'Vehículo creado', type: RespuestaVehiculoDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  create(@Body() dto: CreateVehiculoDto, @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar vehículos',
    description:
      'USER ve los vehículos asociados a su ownerId legado; ADMIN ve todos. Para flota oficial por propietario usa /api/v1/propietarios/{userId}/vehiculos en asignaciones.',
  })
  @ApiResponse({ status: 200, description: 'Listado de vehículos', type: [RespuestaVehiculoDto] })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.vehiculosService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener vehículo por UUID' })
  @ApiResponse({ status: 200, description: 'Vehículo', type: RespuestaVehiculoDto })
  @ApiResponse({ status: 403, description: 'No es dueño ni ADMIN' })
  @ApiResponse({ status: 404, description: 'No existe' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar vehículo parcialmente' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado', type: RespuestaVehiculoDto })
  @ApiResponse({ status: 403, description: 'No es dueño ni ADMIN' })
  @ApiResponse({ status: 404, description: 'No existe' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehiculoDto,
    @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 403, description: 'No es dueño ni ADMIN' })
  @ApiResponse({ status: 404, description: 'No existe' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.remove(id, req.user);
  }
}
