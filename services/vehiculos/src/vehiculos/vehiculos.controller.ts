import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
      'CLIENTE crea vehículos propios. ADMIN y ROOT pueden crear vehículos. RECAUDADOR solo puede consultar vehículos.',
  })
  @ApiResponse({ status: 201, description: 'Vehículo creado', type: RespuestaVehiculoDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'RECAUDADOR no puede crear vehículos' })
  @ApiResponse({ status: 409, description: 'Ya existe un vehículo con esa placa' })
  create(@Body() dto: CreateVehiculoDto, @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar vehículos',
    description:
      'CLIENTE ve sus vehículos. RECAUDADOR, ADMIN y ROOT pueden consultar todos para operación del parqueadero.',
  })
  @ApiResponse({ status: 200, description: 'Listado de vehículos', type: [RespuestaVehiculoDto] })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.vehiculosService.findAll(req.user);
  }

  @Get('placa/:placa')
  @ApiOperation({ summary: 'Buscar vehículo por placa' })
  @ApiResponse({ status: 200, description: 'Vehículo', type: RespuestaVehiculoDto })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'CLIENTE intentando consultar vehículo ajeno' })
  @ApiResponse({ status: 404, description: 'No se encontró un vehículo con esa placa' })
  findByPlaca(@Param('placa') placa: string, @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.findByPlaca(placa, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener vehículo por UUID' })
  @ApiResponse({ status: 200, description: 'Vehículo', type: RespuestaVehiculoDto })
  @ApiResponse({ status: 400, description: 'ID de vehículo inválido. Debe ser un UUID válido' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'No es dueño ni tiene permiso operativo' })
  @ApiResponse({ status: 404, description: 'No se encontró un vehículo con ese ID' })
  findOne(@Param('id', vehicleUuidPipe()) id: string, @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar vehículo parcialmente' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado', type: RespuestaVehiculoDto })
  @ApiResponse({ status: 400, description: 'ID de vehículo inválido o datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'RECAUDADOR no puede modificar vehículos o no es dueño' })
  @ApiResponse({ status: 404, description: 'No se encontró un vehículo con ese ID' })
  update(@Param('id', vehicleUuidPipe()) id: string, @Body() dto: UpdateVehiculoDto,
    @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 400, description: 'ID de vehículo inválido. Debe ser un UUID válido' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'RECAUDADOR no puede eliminar vehículos o no es dueño' })
  @ApiResponse({ status: 404, description: 'No se encontró un vehículo con ese ID' })
  remove(@Param('id', vehicleUuidPipe()) id: string, @Req() req: AuthenticatedRequest) {
    return this.vehiculosService.remove(id, req.user);
  }
}

function vehicleUuidPipe() {
  return new ParseUUIDPipe({
    exceptionFactory: () => new BadRequestException('ID de vehículo inválido. Debe ser un UUID válido'),
  });
}
