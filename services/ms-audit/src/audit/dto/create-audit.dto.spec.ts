import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAuditEventDto } from './create-audit.dto';

describe('CreateAuditEventDto', () => {
  const baseEvent = {
    accion: 'UPDATE',
    datos: { id: '123' },
    usuario: 'admin.sistema',
    rol: 'ADMIN',
    ip: '172.18.0.10',
  };

  it.each([
    ['ms-vehiculos', 'VEHICULO'],
    ['ms-asignaciones', 'ASIGNACION'],
    ['ms-tickets', 'TICKET'],
    ['ms-usuarios', 'USUARIO_PASSWORD'],
    ['ms-usuarios', 'USUARIO_ROL'],
    ['ms-zonas', 'ESPACIO'],
  ])('acepta el contrato de %s/%s', async (servicio, entidad) => {
    const dto = plainToInstance(CreateAuditEventDto, { ...baseEvent, servicio, entidad });
    expect(await validate(dto)).toEqual([]);
  });

  it('acepta IPv6 y un username de hasta 100 caracteres', async () => {
    const dto = plainToInstance(CreateAuditEventDto, {
      ...baseEvent,
      servicio: 'ms-zonas',
      entidad: 'ZONA',
      usuario: '3b6db25b-62df-4f65-9a15-24f75bff2a12',
      ip: '2001:db8::1',
    });
    expect(await validate(dto)).toEqual([]);
  });
});
