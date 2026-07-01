import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AsignacionesService } from './asignaciones.service';
import { AssignmentResponseDto } from './dto/assignment-response.dto';
import { AuditEventResponseDto } from './dto/audit-event-response.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { FleetResponseDto } from './dto/fleet-response.dto';
import { ListAssignmentsQueryDto } from './dto/list-assignments-query.dto';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';
import { TransferAssignmentDto } from './dto/transfer-assignment.dto';

@ApiTags('asignaciones')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class AsignacionesController {
  constructor(private readonly service: AsignacionesService) {}

  @Post('asignaciones')
  @ApiOperation({
    summary: 'Crear o reactivar asignación vehículo-propietario',
    description:
      'CLIENTE puede asignar vehículos únicamente a su propio usuario. ADMIN puede indicar userId y asignar vehículos a cualquier propietario activo.',
  })
  @ApiBody({
    type: CreateAssignmentDto,
    examples: {
      user: {
        summary: 'CLIENTE se asigna un vehículo',
        value: { vehicleId: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316' },
      },
      admin: {
        summary: 'ADMIN asigna vehículo a un propietario',
        value: {
          userId: '3b6db25b-62df-4f65-9a15-24f75bff2a12',
          vehicleId: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Asignación creada o reactivada', type: AssignmentResponseDto })
  @ApiResponse({ status: 400, description: 'Solicitud inválida o propietario inactivo' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'CLIENTE intentando operar sobre otro propietario' })
  @ApiResponse({ status: 404, description: 'Usuario o vehículo no encontrado' })
  @ApiResponse({ status: 409, description: 'El vehículo ya tiene una asignación activa' })
  create(
    @Body() dto: CreateAssignmentDto,
    @Req() req: AuthenticatedRequest,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.service.create(dto, req.user, requestId);
  }

  @Get('asignaciones')
  @ApiOperation({
    summary: 'Listar asignaciones',
    description: 'CLIENTE lista únicamente sus asignaciones. ADMIN puede listar todas y filtrar por userId, vehicleId o status.',
  })
  @ApiResponse({ status: 200, description: 'Listado de asignaciones', type: [AssignmentResponseDto] })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'CLIENTE intentando consultar otro propietario' })
  findAll(@Query() query: ListAssignmentsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.service.findAll(query, req.user);
  }

  @Get('asignaciones/auditoria')
  @ApiOperation({
    summary: 'Consultar auditoría de asignaciones',
    description: 'Solo ADMIN. Permite auditar creación, modificación, transferencia y eliminación lógica de asignaciones.',
  })
  @ApiResponse({ status: 200, description: 'Eventos de auditoría', type: [AuditEventResponseDto] })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol ADMIN' })
  findAudit(@Query() query: ListAuditQueryDto, @Req() req: AuthenticatedRequest) {
    return this.service.findAudit(query, req.user);
  }

  @Delete('asignaciones/:userId/:vehicleId')
  @ApiOperation({
    summary: 'Eliminar lógicamente una asignación',
    description: 'CLIENTE solo elimina asignaciones propias. ADMIN puede eliminar cualquier asignación activa. No borra histórico.',
  })
  @ApiResponse({ status: 200, description: 'Asignación marcada como INACTIVE', type: AssignmentResponseDto })
  @ApiResponse({ status: 400, description: 'userId o vehicleId inválido. Deben ser UUID válidos' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'CLIENTE intentando eliminar asignación ajena' })
  @ApiResponse({ status: 404, description: 'Asignación activa no encontrada' })
  remove(
    @Param('userId', userUuidPipe()) userId: string,
    @Param('vehicleId', vehicleUuidPipe()) vehicleId: string,
    @Req() req: AuthenticatedRequest,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.service.remove(userId, vehicleId, req.user, requestId);
  }

  @Put('asignaciones/vehiculos/:vehicleId/propietario')
  @ApiOperation({
    summary: 'Transferir vehículo a otro propietario',
    description: 'Solo ADMIN. Desactiva la asignación activa anterior y activa o crea la asignación para el nuevo propietario.',
  })
  @ApiBody({
    type: TransferAssignmentDto,
    examples: {
      transfer: {
        summary: 'Transferir a otro propietario',
        value: { userId: '3b6db25b-62df-4f65-9a15-24f75bff2a12' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Asignación activa del nuevo propietario', type: AssignmentResponseDto })
  @ApiResponse({ status: 400, description: 'Propietario inactivo o solicitud inválida' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'Usuario o vehículo no encontrado' })
  @ApiResponse({ status: 409, description: 'El vehículo ya pertenece activamente a ese propietario' })
  transfer(
    @Param('vehicleId', vehicleUuidPipe()) vehicleId: string,
    @Body() dto: TransferAssignmentDto,
    @Req() req: AuthenticatedRequest,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.service.transfer(vehicleId, dto, req.user, requestId);
  }

  @Get('propietarios/:userId/vehiculos')
  @ApiOperation({
    summary: 'Consultar flota agregada por propietario',
    description:
      'CLIENTE solo consulta su propia flota. ADMIN puede consultar cualquier propietario. Agrega tipo y categoría desde el servicio de vehículos.',
  })
  @ApiResponse({ status: 200, description: 'Flota agregada del propietario', type: FleetResponseDto })
  @ApiResponse({ status: 400, description: 'ID de propietario inválido. Debe ser un UUID válido' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'CLIENTE intentando consultar otra flota' })
  @ApiResponse({ status: 404, description: 'Propietario o vehículo no encontrado' })
  findFleet(@Param('userId', userUuidPipe()) userId: string, @Req() req: AuthenticatedRequest) {
    return this.service.findFleet(userId, req.user);
  }
}

function userUuidPipe() {
  return new ParseUUIDPipe({
    exceptionFactory: () => new BadRequestException('ID de usuario inválido. Debe ser un UUID válido'),
  });
}

function vehicleUuidPipe() {
  return new ParseUUIDPipe({
    exceptionFactory: () => new BadRequestException('ID de vehículo inválido. Debe ser un UUID válido'),
  });
}
