import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { AuthUser } from '../auth/auth-user';
import { InternalClients, InternalVehicle } from './clients/internal-clients';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ListAssignmentsQueryDto } from './dto/list-assignments-query.dto';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';
import { TransferAssignmentDto } from './dto/transfer-assignment.dto';
import { AssignmentAuditAction, AssignmentAuditEvent } from './entities/assignment-audit-event.entity';
import { AssignmentStatus, VehicleAssignment } from './entities/vehicle-assignment.entity';
import { EventPublisherService, AuditRequestContext, AuditEvent } from './event-publisher.service';

interface PendingAuditEvent {
  action: AssignmentAuditAction;
  assignment: VehicleAssignment;
  actor: AuthUser;
  context?: AuditRequestContext;
  data?: Record<string, unknown>;
}

@Injectable()
export class AsignacionesService {
  constructor(
    @InjectRepository(VehicleAssignment)
    private readonly assignments: Repository<VehicleAssignment>,
    @InjectRepository(AssignmentAuditEvent)
    private readonly auditEvents: Repository<AssignmentAuditEvent>,
    private readonly dataSource: DataSource,
    private readonly clients: InternalClients,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(dto: CreateAssignmentDto, actor: AuthUser, requestId?: string, auditContext?: AuditRequestContext) {
    const targetUserId = this.resolveTargetUser(dto.userId, actor);
    await this.ensureActiveUser(targetUserId);
    await this.clients.getVehicle(dto.vehicleId);

    const pending: PendingAuditEvent[] = [];
    const result = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(VehicleAssignment);
      const active = await repo.findOne({ where: { vehicleId: dto.vehicleId, status: AssignmentStatus.ACTIVE } });

      if (active && active.userId !== targetUserId) {
        throw new ConflictException('El vehículo ya está asignado a otro propietario activo');
      }
      if (active && active.userId === targetUserId) {
        throw new ConflictException('El vehículo ya está asignado activamente a este propietario');
      }

      const existing = await repo.findOne({ where: { userId: targetUserId, vehicleId: dto.vehicleId } });
      const now = new Date();
      const before = existing ? this.assignmentPayload(existing) : null;
      const assignment =
        existing ??
        repo.create({
          userId: targetUserId,
          vehicleId: dto.vehicleId,
          createdAt: now,
          createdBy: actor.userId,
        });

      assignment.status = AssignmentStatus.ACTIVE;
      assignment.assignedAt = now;
      assignment.unassignedAt = null;
      assignment.updatedAt = now;
      assignment.updatedBy = actor.userId;

      const saved = await repo.save(assignment);
      await this.saveAudit(
        manager,
        saved,
        existing ? AssignmentAuditAction.MODIFICACION : AssignmentAuditAction.CREACION,
        actor,
        before,
        this.assignmentPayload(saved),
        requestId,
      );
      pending.push({
        action: existing ? AssignmentAuditAction.MODIFICACION : AssignmentAuditAction.CREACION,
        assignment: saved,
        actor,
        context: auditContext,
        data: { before, after: this.assignmentPayload(saved), requestId },
      });
      return saved;
    });
    await this.publishPending(pending);
    return result;
  }

  async findAll(query: ListAssignmentsQueryDto, actor: AuthUser) {
    const where: FindOptionsWhere<VehicleAssignment> = {};

    if (this.isAdmin(actor)) {
      if (query.userId) where.userId = query.userId;
    } else {
      if (query.userId && query.userId !== actor.userId) {
        throw new ForbiddenException('No puedes consultar asignaciones de otro propietario');
      }
      where.userId = actor.userId;
    }

    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.status) where.status = query.status;

    return this.assignments.find({ where, order: { updatedAt: 'DESC' } });
  }

  async findActiveByVehicleInternal(vehicleId: string) {
    const assignment = await this.assignments.findOne({
      where: { vehicleId, status: AssignmentStatus.ACTIVE },
    });
    if (!assignment) {
      throw new NotFoundException('El vehículo no tiene propietario activo asignado');
    }
    return assignment;
  }

  async remove(userId: string, vehicleId: string, actor: AuthUser, requestId?: string, auditContext?: AuditRequestContext) {
    if (!this.isAdmin(actor) && userId !== actor.userId) {
      throw new ForbiddenException('No puedes eliminar asignaciones de otro propietario');
    }

    const pending: PendingAuditEvent[] = [];
    const result = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(VehicleAssignment);
      const assignment = await repo.findOne({ where: { userId, vehicleId } });
      if (!assignment || assignment.status !== AssignmentStatus.ACTIVE) {
        throw new NotFoundException('Asignación activa no encontrada');
      }

      const before = this.assignmentPayload(assignment);
      const now = new Date();
      assignment.status = AssignmentStatus.INACTIVE;
      assignment.unassignedAt = now;
      assignment.updatedAt = now;
      assignment.updatedBy = actor.userId;
      const saved = await repo.save(assignment);

      await this.saveAudit(
        manager,
        saved,
        AssignmentAuditAction.ELIMINACION,
        actor,
        before,
        this.assignmentPayload(saved),
        requestId,
      );
      pending.push({
        action: AssignmentAuditAction.ELIMINACION,
        assignment: saved,
        actor,
        context: auditContext,
        data: { before, after: this.assignmentPayload(saved), requestId },
      });
      return saved;
    });
    await this.publishPending(pending);
    return result;
  }

  async transfer(vehicleId: string, dto: TransferAssignmentDto, actor: AuthUser, requestId?: string, auditContext?: AuditRequestContext) {
    this.requireAdmin(actor);
    await this.ensureActiveUser(dto.userId);
    await this.clients.getVehicle(vehicleId);

    const pending: PendingAuditEvent[] = [];
    const result = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(VehicleAssignment);
      const active = await repo.findOne({ where: { vehicleId, status: AssignmentStatus.ACTIVE } });
      if (active?.userId === dto.userId) {
        throw new ConflictException('El vehículo ya pertenece activamente a ese propietario');
      }

      const now = new Date();
      if (active) {
        const beforeActive = this.assignmentPayload(active);
        active.status = AssignmentStatus.INACTIVE;
        active.unassignedAt = now;
        active.updatedAt = now;
        active.updatedBy = actor.userId;
        const inactive = await repo.save(active);
        await this.saveAudit(
          manager,
          inactive,
          AssignmentAuditAction.MODIFICACION,
          actor,
          beforeActive,
          this.assignmentPayload(inactive),
          requestId,
        );
        pending.push({
          action: AssignmentAuditAction.MODIFICACION,
          assignment: inactive,
          actor,
          context: auditContext,
          data: { before: beforeActive, after: this.assignmentPayload(inactive), requestId },
        });
      }

      const target = await repo.findOne({ where: { userId: dto.userId, vehicleId } });
      const beforeTarget = target ? this.assignmentPayload(target) : null;
      const assignment =
        target ??
        repo.create({
          userId: dto.userId,
          vehicleId,
          createdAt: now,
          createdBy: actor.userId,
        });
      assignment.status = AssignmentStatus.ACTIVE;
      assignment.assignedAt = now;
      assignment.unassignedAt = null;
      assignment.updatedAt = now;
      assignment.updatedBy = actor.userId;
      const saved = await repo.save(assignment);

      await this.saveAudit(
        manager,
        saved,
        target ? AssignmentAuditAction.MODIFICACION : AssignmentAuditAction.CREACION,
        actor,
        beforeTarget,
        this.assignmentPayload(saved),
        requestId,
      );
      pending.push({
        action: target ? AssignmentAuditAction.MODIFICACION : AssignmentAuditAction.CREACION,
        assignment: saved,
        actor,
        context: auditContext,
        data: { before: beforeTarget, after: this.assignmentPayload(saved), requestId },
      });
      return saved;
    });
    await this.publishPending(pending);
    return result;
  }

  async findFleet(userId: string, actor: AuthUser) {
    if (!this.isAdmin(actor) && userId !== actor.userId) {
      throw new ForbiddenException('No puedes consultar la flota de otro propietario');
    }

    await this.ensureActiveUser(userId);
    const assignments = await this.assignments.find({
      where: { userId, status: AssignmentStatus.ACTIVE },
      order: { assignedAt: 'DESC' },
    });
    const vehicles = await Promise.all(assignments.map((assignment) => this.clients.getVehicle(assignment.vehicleId)));

    return {
      userId,
      total: vehicles.length,
      vehicles: vehicles.map((vehicle, index) => this.fleetVehiclePayload(assignments[index], vehicle)),
    };
  }

  async findAudit(query: ListAuditQueryDto, actor: AuthUser) {
    this.requireAdmin(actor);
    const where: FindOptionsWhere<AssignmentAuditEvent> = {};
    if (query.userId) where.userId = query.userId;
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.action) where.action = query.action;
    return this.auditEvents.find({ where, order: { timestamp: 'DESC' } });
  }

  private resolveTargetUser(userId: string | undefined, actor: AuthUser): string {
    if (this.isAdmin(actor)) {
      if (!userId) throw new BadRequestException('userId es obligatorio para ADMIN');
      return userId;
    }
    if (userId && userId !== actor.userId) {
      throw new ForbiddenException('No puedes crear asignaciones para otro propietario');
    }
    return actor.userId;
  }

  private async ensureActiveUser(userId: string) {
    const user = await this.clients.getUser(userId);
    if (!user.active) throw new BadRequestException('El propietario está inactivo');
    return user;
  }

  private async saveAudit(
    manager: EntityManager,
    assignment: VehicleAssignment,
    action: AssignmentAuditAction,
    actor: AuthUser,
    beforePayload: Record<string, unknown> | null,
    afterPayload: Record<string, unknown> | null,
    requestId?: string,
  ) {
    const audit = manager.getRepository(AssignmentAuditEvent).create({
      userId: assignment.userId,
      vehicleId: assignment.vehicleId,
      action,
      timestamp: new Date(),
      actorUserId: actor.userId,
      actorUsername: actor.username,
      actorRoles: actor.roles.join(','),
      beforePayload,
      afterPayload,
      requestId: requestId ?? null,
    });
    await manager.getRepository(AssignmentAuditEvent).save(audit);
  }

  private assignmentPayload(assignment: VehicleAssignment): Record<string, unknown> {
    return {
      userId: assignment.userId,
      vehicleId: assignment.vehicleId,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      unassignedAt: assignment.unassignedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      createdBy: assignment.createdBy,
      updatedBy: assignment.updatedBy,
    };
  }

  private fleetVehiclePayload(assignment: VehicleAssignment, vehicle: InternalVehicle) {
    return {
      assignment: {
        userId: assignment.userId,
        vehicleId: assignment.vehicleId,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
      },
      vehicle: {
        id: vehicle.id,
        placa: vehicle.placa,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        anio: vehicle.anio,
        color: vehicle.color,
        tipo: this.normalizeType(vehicle.tipo),
        categoria: this.normalizeCategory(vehicle.clasificacion),
      },
    };
  }

  private normalizeType(tipo: string): string {
    const normalized = tipo.toLowerCase();
    if (normalized === 'auto') return 'automovil';
    if (normalized === 'motocicleta') return 'moto';
    if (normalized === 'camioneta') return 'camioneta';
    return normalized;
  }

  private normalizeCategory(clasificacion: string): string {
    const normalized = clasificacion.toLowerCase();
    if (normalized === 'electrico') return 'electrico';
    if (normalized === 'hibrido') return 'hibrido';
    if (normalized === 'gasolina') return 'combustion';
    return normalized;
  }

  private isAdmin(user: AuthUser): boolean {
    return user.roles.some(r => ['ADMIN', 'ROOT'].includes(r));
  }

  private requireAdmin(user: AuthUser) {
    if (!this.isAdmin(user)) throw new ForbiddenException('Se requiere rol ADMIN o ROOT');
  }

  private async emitRabbitEvent(
    actionType: AssignmentAuditAction,
    assignment: VehicleAssignment,
    user: AuthUser,
    auditContext?: AuditRequestContext,
    datosExtra?: Record<string, unknown>,
  ) {
    let accion: AuditEvent['accion'] = 'UPDATE';
    if (actionType === AssignmentAuditAction.CREACION) accion = 'CREATE';
    else if (actionType === AssignmentAuditAction.ELIMINACION) accion = 'DELETE';

    const event: AuditEvent = {
      servicio: 'ms-asignaciones',
      accion,
      entidad: 'ASIGNACION',
      datos: {
        userId: assignment.userId,
        vehicleId: assignment.vehicleId,
        status: assignment.status,
        ...datosExtra,
      },
      usuario: user.username,
      rol: user.roles[0] ?? 'USER',
      ip: this.normalizeIp(auditContext?.ip),
    };

    await this.eventPublisher.publish(event);
  }

  private async publishPending(events: PendingAuditEvent[]): Promise<void> {
    for (const event of events) {
      await this.emitRabbitEvent(event.action, event.assignment, event.actor, event.context, event.data);
    }
  }

  private normalizeIp(ip?: string): string {
    if (!ip || ip === '::1') return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    return ip;
  }
}
