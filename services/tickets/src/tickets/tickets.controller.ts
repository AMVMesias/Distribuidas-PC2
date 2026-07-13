import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@ApiBearerAuth('bearerAuth')
@Controller('api/v1/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Post()
  @ApiOperation({
    summary: 'Emitir ticket de ingreso',
    description: 'RECAUDADOR, ADMIN o ROOT registran entrada. El propietario se obtiene desde la asignación activa del vehículo.',
  })
  @ApiBody({
    type: CreateTicketDto,
    examples: {
      porId: { summary: 'Por ID de vehículo', value: { idEspacio: '7cb1a340-7d9c-41de-9983-83fb1849bb7d', idVehiculo: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316' } },
      porPlaca: { summary: 'Por placa', value: { idEspacio: '7cb1a340-7d9c-41de-9983-83fb1849bb7d', placa: 'ABC-1234' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Ticket emitido', type: TicketResponseDto })
  @ApiResponse({ status: 400, description: 'Solicitud inválida' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'Rol sin permisos para emitir tickets' })
  @ApiResponse({ status: 404, description: 'Vehículo, asignación o espacio no encontrado' })
  @ApiResponse({ status: 409, description: 'Vehículo con ticket activo o espacio no disponible' })
  create(@Body() dto: CreateTicketDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(dto, req.user, { ip: req.ip });
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets', description: 'CLIENTE ve los propios. RECAUDADOR, ADMIN y ROOT pueden listar tickets operativos.' })
  @ApiResponse({ status: 200, description: 'Listado de tickets', type: [TicketResponseDto] })
  @ApiResponse({ status: 400, description: 'Filtro inválido. Revisa estado, idUsuario, idVehiculo o idEspacio' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido' })
  @ApiResponse({ status: 403, description: 'Rol sin permisos para listar tickets' })
  findAll(@Query() query: ListTicketsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.service.findAll(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ticket por ID' })
  @ApiResponse({ status: 200, description: 'Ticket', type: TicketResponseDto })
  @ApiResponse({ status: 400, description: 'ID de ticket inválido. Debe ser un UUID válido' })
  @ApiResponse({ status: 403, description: 'CLIENTE intentando consultar ticket ajeno' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  findOne(@Param('id', ticketUuidPipe()) id: string, @Req() req: AuthenticatedRequest) {
    return this.service.findOne(id, req.user);
  }

  @Patch(':id/pagar')
  @ApiOperation({ summary: 'Registrar salida y pago del ticket' })
  @ApiResponse({ status: 200, description: 'Ticket pagado', type: TicketResponseDto })
  @ApiResponse({ status: 400, description: 'ID de ticket inválido. Debe ser un UUID válido' })
  @ApiResponse({ status: 403, description: 'Rol sin permisos para pagar tickets' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  @ApiResponse({ status: 409, description: 'Ticket no está activo' })
  pay(@Param('id', ticketUuidPipe()) id: string, @Req() req: AuthenticatedRequest, @Headers('x-request-id') requestId?: string) {
    return this.service.pay(id, req.user, { ip: req.ip });
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar ticket activo' })
  @ApiResponse({ status: 200, description: 'Ticket cancelado', type: TicketResponseDto })
  @ApiResponse({ status: 400, description: 'ID de ticket inválido. Debe ser un UUID válido' })
  @ApiResponse({ status: 403, description: 'Rol sin permisos para cancelar tickets' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  @ApiResponse({ status: 409, description: 'Ticket no está activo' })
  cancel(@Param('id', ticketUuidPipe()) id: string, @Req() req: AuthenticatedRequest) {
    return this.service.cancel(id, req.user, { ip: req.ip });
  }
}

function ticketUuidPipe() {
  return new ParseUUIDPipe({
    exceptionFactory: () => new BadRequestException('ID de ticket inválido. Debe ser un UUID válido'),
  });
}
