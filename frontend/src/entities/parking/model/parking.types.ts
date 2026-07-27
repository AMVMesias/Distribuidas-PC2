export type SpaceStatus = 'DISPONIBLE' | 'OCUPADO' | 'RESERVADO' | 'FUERA_DE_SERVICIO';
export type SpaceType = 'MOTO' | 'AUTO' | 'BUS';
export type VehicleType = 'auto' | 'motocicleta' | 'camioneta';
export type TicketStatus = 'ACTIVO' | 'PAGADO' | 'CANCELADO';

export interface Space {
  id: string; codigo: string; descripcion: string; capacidad: number;
  tipo: SpaceType; estado: SpaceStatus; activo: boolean;
  idZona: string; nombreZona: string;
}

export interface Zone {
  id: string; codigo: string; nombre: string; descripcion: string;
  estado: number; tipo: 'VIP' | 'REGULAR' | 'INTERNA' | 'EXTERNA' | 'PREFERENCIAL';
  capacidad: number; espacios: Space[];
}

export interface Vehicle {
  id: string; placa: string; marca: string; modelo: string; anio: number;
  color: string; clasificacion: 'Electrico' | 'Hibrido' | 'Gasolina';
  tipo: VehicleType; capacidadCarga?: number; numeroPuertas?: number;
}

export interface Ticket {
  id: string; codigo: string; idEspacio: string; idUsuario: string;
  idVehiculo: string; placaVehiculo: string; fechaHoraIngreso: string;
  fechaHoraSalida?: string; estado: TicketStatus; idEmpleado: string;
  valorRecaudado: string; tipoVehiculo: string; tipoEspacio: string;
}

export interface Assignment {
  userId: string; vehicleId: string; status: 'ACTIVE' | 'INACTIVE';
  assignedAt: string; unassignedAt?: string; createdAt: string; updatedAt: string;
}

export interface AssignmentAudit {
  id: string; userId: string; vehicleId: string;
  action: 'CREACION' | 'MODIFICACION' | 'ELIMINACION';
  timestamp: string; actorUserId: string; actorUsername: string; actorRoles: string;
}
