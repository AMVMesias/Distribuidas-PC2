import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InternalVehicle {
  id: string;
  ownerId?: string;
  placa: string;
  tipo: string;
}

export interface InternalAssignment {
  userId: string;
  vehicleId: string;
  status: string;
}

export interface InternalSpace {
  id: string;
  codigo: string;
  tipo: string;
  estado: string;
  activo: boolean;
  idZona: string;
  nombreZona: string;
}

@Injectable()
export class InternalClients {
  private readonly token: string;
  private readonly vehiculosUrl: string;
  private readonly asignacionesUrl: string;
  private readonly zonasUrl: string;

  constructor(config: ConfigService) {
    this.token = config.get('INTERNAL_SERVICE_TOKEN', 'change-me-internal-token');
    this.vehiculosUrl = config.get('VEHICULOS_INTERNAL_URL', 'http://vehiculos:3000');
    this.asignacionesUrl = config.get('ASIGNACIONES_INTERNAL_URL', 'http://asignaciones:3000');
    this.zonasUrl = config.get('ZONAS_INTERNAL_URL', 'http://zonas:8080');
  }

  getVehicleById(id: string): Promise<InternalVehicle> {
    return this.getJson(`${this.vehiculosUrl}/api/v1/internal/vehiculos/${id}`, 'Vehículo', id);
  }

  getVehicleByPlaca(placa: string): Promise<InternalVehicle> {
    return this.getJson(`${this.vehiculosUrl}/api/v1/internal/vehiculos/placa/${encodeURIComponent(placa)}`, 'Vehículo', placa);
  }

  getActiveAssignment(vehicleId: string): Promise<InternalAssignment> {
    return this.getJson(`${this.asignacionesUrl}/api/v1/internal/asignaciones/vehiculos/${vehicleId}/activa`, 'Asignación activa', vehicleId);
  }

  getSpace(id: string): Promise<InternalSpace> {
    return this.getJson(`${this.zonasUrl}/api/v1/internal/espacios/${id}`, 'Espacio', id);
  }

  setSpaceStatus(id: string, status: 'OCUPADO' | 'DISPONIBLE'): Promise<InternalSpace> {
    return this.patchJson(`${this.zonasUrl}/api/v1/internal/espacios/${id}/estado/${status}`, 'Espacio', id);
  }

  private async getJson<T>(url: string, label: string, id: string): Promise<T> {
    return this.requestJson<T>(url, 'GET', label, id);
  }

  private async patchJson<T>(url: string, label: string, id: string): Promise<T> {
    return this.requestJson<T>(url, 'PATCH', label, id);
  }

  private async requestJson<T>(url: string, method: 'GET' | 'PATCH', label: string, id: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: { 'X-Internal-Service-Token': this.token },
      });
    } catch {
      throw new BadGatewayException(`No se pudo contactar el servicio interno para ${label.toLowerCase()}`);
    }

    if (response.status === 404) {
      throw new NotFoundException(`${label} no encontrado: ${id}`);
    }
    if (!response.ok) {
      throw new BadGatewayException(`El servicio interno de ${label.toLowerCase()} respondió ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
