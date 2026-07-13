import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';
import { FactoryVehiculos } from './factory/factory-vehiculo';
import { AuthUser } from '../auth/auth-user';
import { Auto } from './entities/auto.entity';
import { Camioneta } from './entities/camioneta.entity';
import { Motocicleta } from './entities/motocicleta.entity';
import { AuditEvent, AuditRequestContext, EventPublisherService } from './event-publisher.service';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo) private readonly repositoryVehiculos: Repository<Vehiculo>,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(dto: CreateVehiculoDto, user: AuthUser, auditContext?: AuditRequestContext) {
    this.ensureCanWrite(user);
    const existe = await this.repositoryVehiculos.findOne({ where: { placa: dto.datos.placa } });
    if (existe) throw new ConflictException(`Ya existe un vehículo con la placa ${dto.datos.placa}`);
    const vehiculo = FactoryVehiculos.crear(dto);
    vehiculo.ownerId = user.userId;
    const saved = await this.repositoryVehiculos.save(vehiculo);
    await this.emitEvent('CREATE', saved, user, auditContext);
    return saved;
  }

  findAll(user: AuthUser): Promise<Vehiculo[]> {
    return this.canReadAll(user)
      ? this.repositoryVehiculos.find()
      : this.repositoryVehiculos.find({ where: { ownerId: user.userId } });
  }

  async findOne(id: string, user: AuthUser) {
    const where = this.canReadAll(user) ? { id } : { id, ownerId: user.userId };
    const vehiculo = await this.repositoryVehiculos.findOne({ where });
    if (!vehiculo) throw new NotFoundException(`No se encontró un vehículo con el ID ${id}`);
    return vehiculo;
  }

  async findByPlaca(placa: string, user: AuthUser) {
    const placaNormalizada = placa.trim().toUpperCase();
    const where = this.canReadAll(user) ? { placa: placaNormalizada } : { placa: placaNormalizada, ownerId: user.userId };
    const vehiculo = await this.repositoryVehiculos.findOne({ where });
    if (!vehiculo) throw new NotFoundException(`No se encontró un vehículo con la placa ${placaNormalizada}`);
    return vehiculo;
  }

  async update(id: string, dto: UpdateVehiculoDto, user: AuthUser, auditContext?: AuditRequestContext) {
    this.ensureCanWrite(user);
    const vehiculo = await this.findOne(id, user);
    if (dto.datos) Object.assign(vehiculo, dto.datos);
    const saved = await this.repositoryVehiculos.save(vehiculo);
    await this.emitEvent('UPDATE', saved, user, auditContext, { cambios: dto.datos });
    return saved;
  }

  async remove(id: string, user: AuthUser, auditContext?: AuditRequestContext) {
    this.ensureCanWrite(user);
    const vehiculo = await this.findOne(id, user);
    await this.repositoryVehiculos.remove(vehiculo);
    await this.emitEvent('DELETE', vehiculo, user, auditContext);
    return vehiculo;
  }

  async findInternalById(id: string) {
    const vehiculo = await this.repositoryVehiculos.findOne({ where: { id } });
    if (!vehiculo) throw new NotFoundException(`No se encontró un vehículo con el ID ${id}`);
    return this.internalPayload(vehiculo);
  }

  async findInternalByPlaca(placa: string) {
    const placaNormalizada = placa.trim().toUpperCase();
    const vehiculo = await this.repositoryVehiculos.findOne({ where: { placa: placaNormalizada } });
    if (!vehiculo) throw new NotFoundException(`No se encontró un vehículo con la placa ${placaNormalizada}`);
    return this.internalPayload(vehiculo);
  }

  private internalPayload(vehiculo: Vehiculo) {
    return {
      id: vehiculo.id,
      ownerId: vehiculo.ownerId,
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      clasificacion: vehiculo.clasificacion,
      tipo: this.tipoPublico(vehiculo),
    };
  }

  private canReadAll(user: AuthUser): boolean {
    return user.roles.some(r => ['RECAUDADOR', 'ADMIN', 'ROOT'].includes(r));
  }

  private ensureCanWrite(user: AuthUser) {
    const adminLike = user.roles.some(r => ['ADMIN', 'ROOT'].includes(r));
    if (user.roles.includes('RECAUDADOR') && !adminLike) {
      throw new ForbiddenException('RECAUDADOR solo puede consultar vehículos, no crearlos, modificarlos ni eliminarlos');
    }
  }

  private tipoPublico(vehiculo: Vehiculo): string {
    if (vehiculo instanceof Auto) return 'auto';
    if (vehiculo instanceof Motocicleta) return 'motocicleta';
    if (vehiculo instanceof Camioneta) return 'camioneta';
    const tipo = vehiculo.obtenerTipo().toLowerCase();
    return tipo === 'motocicleta' ? 'motocicleta' : tipo;
  }

  private async emitEvent(
    accion: AuditEvent['accion'],
    vehiculo: Vehiculo,
    user: AuthUser,
    auditContext?: AuditRequestContext,
    datosExtra?: Record<string, unknown>,
  ) {
    const event: AuditEvent = {
      servicio: 'ms-vehiculos',
      accion,
      entidad: 'VEHICULO',
      datos: {
        id: vehiculo.id,
        placa: vehiculo.placa,
        ownerId: vehiculo.ownerId,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        color: vehiculo.color,
        clasificacion: vehiculo.clasificacion,
        ...datosExtra,
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
