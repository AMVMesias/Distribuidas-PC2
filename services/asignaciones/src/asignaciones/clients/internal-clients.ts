import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InternalUser {
  id: string;
  username: string;
  active: boolean;
  roles: string[];
}

export interface InternalVehicle {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  clasificacion: string;
  tipo: string;
}

@Injectable()
export class InternalClients {
  private readonly token: string;
  private readonly usuariosUrl: string;
  private readonly vehiculosUrl: string;

  constructor(config: ConfigService) {
    this.token = config.get('INTERNAL_SERVICE_TOKEN', 'change-me-internal-token');
    this.usuariosUrl = config.get('USUARIOS_INTERNAL_URL', 'http://usuarios:8080');
    this.vehiculosUrl = config.get('VEHICULOS_INTERNAL_URL', 'http://vehiculos:3000');
  }

  async getUser(userId: string): Promise<InternalUser> {
    return this.getJson<InternalUser>(`${this.usuariosUrl}/api/v1/internal/usuarios/${userId}`, 'Usuario', userId);
  }

  async getVehicle(vehicleId: string): Promise<InternalVehicle> {
    return this.getJson<InternalVehicle>(`${this.vehiculosUrl}/api/v1/internal/vehiculos/${vehicleId}`, 'Vehículo', vehicleId);
  }

  private async getJson<T>(url: string, label: string, id: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'X-Internal-Service-Token': this.token,
        },
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
