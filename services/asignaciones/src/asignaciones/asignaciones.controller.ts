import {
  Body,
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AsignacionesService } from './asignaciones.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
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
  @ApiOperation({ summary: 'Crear o reactivar asignación vehículo-propietario' })
  @ApiResponse({ status: 201, description: 'Asignación creada o reactivada' })
  create(
    @Body() dto: CreateAssignmentDto,
    @Req() req: AuthenticatedRequest,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.service.create(dto, req.user, requestId);
  }

  @Get('asignaciones')
  @ApiOperation({ summary: 'Listar asignaciones' })
  findAll(@Query() query: ListAssignmentsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.service.findAll(query, req.user);
  }

  @Get('asignaciones/auditoria')
  @ApiOperation({ summary: 'Consultar auditoría de asignaciones' })
  findAudit(@Query() query: ListAuditQueryDto, @Req() req: AuthenticatedRequest) {
    return this.service.findAudit(query, req.user);
  }

  @Delete('asignaciones/:userId/:vehicleId')
  @ApiOperation({ summary: 'Eliminar lógicamente una asignación' })
  remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Req() req: AuthenticatedRequest,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.service.remove(userId, vehicleId, req.user, requestId);
  }

  @Put('asignaciones/vehiculos/:vehicleId/propietario')
  @ApiOperation({ summary: 'Transferir vehículo a otro propietario' })
  transfer(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: TransferAssignmentDto,
    @Req() req: AuthenticatedRequest,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.service.transfer(vehicleId, dto, req.user, requestId);
  }

  @Get('propietarios/:userId/vehiculos')
  @ApiOperation({ summary: 'Consultar flota agregada por propietario' })
  findFleet(@Param('userId', ParseUUIDPipe) userId: string, @Req() req: AuthenticatedRequest) {
    return this.service.findFleet(userId, req.user);
  }
}
