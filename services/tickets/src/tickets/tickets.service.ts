import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../auth/auth-user';
import { InternalClients, InternalSpace, InternalVehicle } from './clients/internal-clients';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { EventPublisherService, AuditRequestContext, AuditEvent } from './event-publisher.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    private readonly clients: InternalClients,
    private readonly config: ConfigService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(dto: CreateTicketDto, actor: AuthUser, auditContext?: AuditRequestContext) {
    this.requireOperator(actor);
    if (!dto.idVehiculo && !dto.placa) {
      throw new BadRequestException('Debes enviar idVehiculo o placa para emitir el ticket');
    }

    const vehicle = dto.idVehiculo
      ? await this.clients.getVehicleById(dto.idVehiculo)
      : await this.clients.getVehicleByPlaca(dto.placa!.trim().toUpperCase());
    const assignment = await this.clients.getActiveAssignment(vehicle.id);
    const space = await this.clients.getSpace(dto.idEspacio);

    if (!space.activo || space.estado !== 'DISPONIBLE') {
      throw new ConflictException(`El espacio ${space.codigo} no está disponible. Estado actual: ${space.estado}`);
    }

    const active = await this.tickets.findOne({ where: { idVehiculo: vehicle.id, estado: TicketStatus.ACTIVO } });
    if (active) {
      throw new ConflictException(`El vehículo ${vehicle.placa} ya tiene un ticket activo`);
    }

    const now = new Date();
    const ticket = this.tickets.create({
      codigo: await this.generateCode(space),
      idEspacio: space.id,
      idUsuario: assignment.userId,
      idVehiculo: vehicle.id,
      placaVehiculo: vehicle.placa,
      fechaHoraIngreso: now,
      fechaHoraSalida: null,
      estado: TicketStatus.ACTIVO,
      idEmpleado: actor.userId,
      valorRecaudado: '0.00',
      tipoVehiculo: this.normalizeVehicleType(vehicle),
      tipoEspacio: space.tipo.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    });

    await this.clients.setSpaceStatus(space.id, 'OCUPADO');
    try {
      const saved = await this.tickets.save(ticket);
      await this.emitRabbitEvent('CREATE', saved, actor, auditContext);
      return saved;
    } catch (error) {
      await this.releaseSpaceQuietly(space.id);
      throw new ConflictException('No se pudo emitir el ticket porque el vehículo ya tiene un ticket activo o el código se repitió');
    }
  }

  async findAll(query: ListTicketsQueryDto, actor: AuthUser) {
    this.requireReader(actor);
    const where: FindOptionsWhere<Ticket> = {};
    if (this.isClientOnly(actor)) {
      where.idUsuario = actor.userId;
    } else if (query.idUsuario) {
      where.idUsuario = query.idUsuario;
    }
    if (query.estado) where.estado = query.estado;
    if (query.idVehiculo) where.idVehiculo = query.idVehiculo;
    if (query.idEspacio) where.idEspacio = query.idEspacio;
    return this.tickets.find({ where, order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, actor: AuthUser) {
    this.requireReader(actor);
    const ticket = await this.tickets.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket no encontrado con ID ${id}`);
    if (this.isClientOnly(actor) && ticket.idUsuario !== actor.userId) {
      throw new ForbiddenException('No puedes consultar tickets de otro cliente');
    }
    return ticket;
  }

  async pay(id: string, actor: AuthUser, auditContext?: AuditRequestContext) {
    this.requireOperator(actor);
    const ticket = await this.findActiveTicket(id);
    const now = new Date();
    ticket.fechaHoraSalida = now;
    ticket.valorRecaudado = this.calculateValue(ticket, now);
    ticket.estado = TicketStatus.PAGADO;
    ticket.updatedAt = now;
    const saved = await this.tickets.save(ticket);
    await this.clients.setSpaceStatus(saved.idEspacio, 'DISPONIBLE');
    await this.emitRabbitEvent('UPDATE', saved, actor, auditContext);
    return saved;
  }

  async cancel(id: string, actor: AuthUser, auditContext?: AuditRequestContext) {
    this.requireOperator(actor);
    const ticket = await this.findActiveTicket(id);
    ticket.fechaHoraSalida = new Date();
    ticket.valorRecaudado = '0.00';
    ticket.estado = TicketStatus.CANCELADO;
    ticket.updatedAt = ticket.fechaHoraSalida;
    const saved = await this.tickets.save(ticket);
    await this.clients.setSpaceStatus(saved.idEspacio, 'DISPONIBLE');
    await this.emitRabbitEvent('UPDATE', saved, actor, auditContext);
    return saved;
  }

  private async findActiveTicket(id: string) {
    const ticket = await this.tickets.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket no encontrado con ID ${id}`);
    if (ticket.estado !== TicketStatus.ACTIVO) {
      throw new ConflictException(`El ticket ${ticket.codigo} no está activo. Estado actual: ${ticket.estado}`);
    }
    return ticket;
  }

  private calculateValue(ticket: Ticket, end: Date): string {
    const elapsedMinutes = Math.ceil((end.getTime() - ticket.fechaHoraIngreso.getTime()) / 60000);
    const chargedMinutes = Math.max(30, elapsedMinutes);
    const vehicleRate = this.getNumber(`TICKET_RATE_${ticket.tipoVehiculo}`, this.defaultVehicleRate(ticket.tipoVehiculo));
    const spaceFactor = this.getNumber(`TICKET_SPACE_FACTOR_${ticket.tipoEspacio}`, this.defaultSpaceFactor(ticket.tipoEspacio));
    return ((chargedMinutes / 60) * vehicleRate * spaceFactor).toFixed(2);
  }

  private async generateCode(space: InternalSpace): Promise<string> {
    const initialName = (space.codigo || space.nombreZona || 'X').trim().substring(0, 1).toUpperCase();
    const initialType = space.tipo.trim().substring(0, 1).toUpperCase();
    const stamp = this.formatDate(new Date());
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = randomUUID().substring(0, 4).toUpperCase();
      const code = `TICK-${initialName}${initialType}-${stamp}-${suffix}`;
      const exists = await this.tickets.findOne({ where: { codigo: code } });
      if (!exists) return code;
    }
    throw new ConflictException('No se pudo generar un código único para el ticket');
  }

  private formatDate(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  private normalizeVehicleType(vehicle: InternalVehicle): string {
    const normalized = vehicle.tipo.toLowerCase();
    if (normalized === 'motocicleta' || normalized === 'moto') return 'MOTO';
    if (normalized === 'auto' || normalized === 'automovil') return 'AUTO';
    if (normalized === 'camioneta') return 'CAMIONETA';
    if (normalized === 'bus') return 'BUS';
    throw new BadRequestException(`Tipo de vehículo no soportado para tarifa: ${vehicle.tipo}`);
  }

  private getNumber(key: string, fallback: number): number {
    const raw = this.config.get<string>(key);
    const parsed = raw === undefined ? fallback : Number(raw);
    if (Number.isNaN(parsed) || parsed < 0) {
      throw new BadRequestException(`La tarifa ${key} no está configurada correctamente`);
    }
    return parsed;
  }

  private defaultVehicleRate(type: string): number {
    if (type === 'MOTO') return 0.5;
    if (type === 'AUTO') return 1;
    if (type === 'CAMIONETA') return 1.25;
    if (type === 'BUS') return 2;
    return 1;
  }

  private defaultSpaceFactor(type: string): number {
    if (type === 'BUS') return 1.5;
    return 1;
  }

  private requireOperator(actor: AuthUser) {
    if (!actor.roles.some(role => ['RECAUDADOR', 'ADMIN', 'ROOT'].includes(role))) {
      throw new ForbiddenException('Se requiere rol RECAUDADOR, ADMIN o ROOT para operar tickets');
    }
  }

  private requireReader(actor: AuthUser) {
    if (!actor.roles.some(role => ['CLIENTE', 'RECAUDADOR', 'ADMIN', 'ROOT'].includes(role))) {
      throw new ForbiddenException('No tienes permisos para consultar tickets');
    }
  }

  private isClientOnly(actor: AuthUser) {
    return actor.roles.includes('CLIENTE') && !actor.roles.some(role => ['RECAUDADOR', 'ADMIN', 'ROOT'].includes(role));
  }

  private async releaseSpaceQuietly(idEspacio: string) {
    try {
      await this.clients.setSpaceStatus(idEspacio, 'DISPONIBLE');
    } catch {
      // La respuesta principal debe explicar el error de ticket, no ocultarlo por una compensación fallida.
    }
  }

  private async emitRabbitEvent(
    accion: AuditEvent['accion'],
    ticket: Ticket,
    user: AuthUser,
    auditContext?: AuditRequestContext,
  ) {
    const event: AuditEvent = {
      servicio: 'ms-tickets',
      accion,
      entidad: 'TICKET',
      datos: {
        id: ticket.id,
        codigo: ticket.codigo,
        estado: ticket.estado,
        idVehiculo: ticket.idVehiculo,
        idEspacio: ticket.idEspacio,
      },
      usuario: user.username,
      rol: user.roles[0] ?? 'USER',
      ip: this.normalizeIp(auditContext?.ip),
    };

    await this.eventPublisher.publish(event);
  }

  private normalizeIp(ip?: string): string {
    if (!ip || ip === '::1') return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    return ip;
  }
}
