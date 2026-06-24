import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class VehiculosService {
  constructor(@InjectRepository(Vehiculo) private readonly repository: Repository<Vehiculo>) {}

  async create(dto: CreateVehiculoDto, ownerId: string) {
    const existe = await this.repository.findOne({ where: { placa: dto.datos.placa } });
    if (existe) throw new ConflictException(`Ya existe un vehículo con la placa ${dto.datos.placa}`);
    const vehiculo = FactoryVehiculos.crear(dto);
    vehiculo.ownerId = ownerId;
    return this.repository.save(vehiculo);
  }

  findAll(user: AuthUser): Promise<Vehiculo[]> {
    return user.roles.includes('ADMIN')
      ? this.repository.find()
      : this.repository.find({ where: { ownerId: user.userId } });
  }

  async findOne(id: string, user: AuthUser) {
    const where = user.roles.includes('ADMIN') ? { id } : { id, ownerId: user.userId };
    const vehiculo = await this.repository.findOne({ where });
    if (!vehiculo) throw new NotFoundException(`No se encontró un vehículo con el ID ${id}`);
    return vehiculo;
  }

  async update(id: string, dto: UpdateVehiculoDto, user: AuthUser) {
    const vehiculo = await this.findOne(id, user);
    if (dto.datos) Object.assign(vehiculo, dto.datos);
    return this.repository.save(vehiculo);
  }

  async remove(id: string, user: AuthUser) {
    const vehiculo = await this.findOne(id, user);
    await this.repository.remove(vehiculo);
    return vehiculo;
  }

  async findInternalById(id: string) {
    const vehiculo = await this.repository.findOne({ where: { id } });
    if (!vehiculo) throw new NotFoundException(`No se encontró un vehículo con el ID ${id}`);
    return {
      id: vehiculo.id,
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      clasificacion: vehiculo.clasificacion,
      tipo: this.tipoPublico(vehiculo),
    };
  }

  private tipoPublico(vehiculo: Vehiculo): string {
    if (vehiculo instanceof Auto) return 'auto';
    if (vehiculo instanceof Motocicleta) return 'motocicleta';
    if (vehiculo instanceof Camioneta) return 'camioneta';
    const tipo = vehiculo.obtenerTipo().toLowerCase();
    return tipo === 'motocicleta' ? 'motocicleta' : tipo;
  }
}
