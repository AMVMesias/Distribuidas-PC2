import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum TicketStatus {
  ACTIVO = 'ACTIVO',
  PAGADO = 'PAGADO',
  CANCELADO = 'CANCELADO',
}

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 64 })
  codigo!: string;

  @Column({ name: 'id_espacio', type: 'uuid' })
  idEspacio!: string;

  @Column({ name: 'id_usuario', type: 'uuid' })
  idUsuario!: string;

  @Column({ name: 'id_vehiculo', type: 'uuid' })
  idVehiculo!: string;

  @Column({ name: 'placa_vehiculo', length: 16 })
  placaVehiculo!: string;

  @Column({ name: 'fecha_hora_ingreso', type: 'timestamptz' })
  fechaHoraIngreso!: Date;

  @Column({ name: 'fecha_hora_salida', type: 'timestamptz', nullable: true })
  fechaHoraSalida!: Date | null;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ACTIVO })
  estado!: TicketStatus;

  @Column({ name: 'id_empleado', type: 'uuid' })
  idEmpleado!: string;

  @Column({ name: 'valor_recaudado', type: 'numeric', precision: 10, scale: 2, default: 0 })
  valorRecaudado!: string;

  @Column({ name: 'tipo_vehiculo', length: 32 })
  tipoVehiculo!: string;

  @Column({ name: 'tipo_espacio', length: 32 })
  tipoEspacio!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
