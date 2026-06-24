import { ApiProperty } from '@nestjs/swagger';

class FleetAssignmentDto {
  @ApiProperty({ format: 'uuid', example: '3b6db25b-62df-4f65-9a15-24f75bff2a12' })
  userId!: string;

  @ApiProperty({ format: 'uuid', example: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316' })
  vehicleId!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-24T14:45:00.000Z' })
  assignedAt!: Date;
}

class FleetVehicleDto {
  @ApiProperty({ format: 'uuid', example: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316' })
  id!: string;

  @ApiProperty({ example: 'ABC-1234' })
  placa!: string;

  @ApiProperty({ example: 'Toyota' })
  marca!: string;

  @ApiProperty({ example: 'Corolla' })
  modelo!: string;

  @ApiProperty({ example: 2023 })
  anio!: number;

  @ApiProperty({ example: 'Gris' })
  color!: string;

  @ApiProperty({ enum: ['moto', 'automovil', 'camioneta'], example: 'automovil' })
  tipo!: string;

  @ApiProperty({ enum: ['electrico', 'hibrido', 'combustion'], example: 'combustion' })
  categoria!: string;
}

class FleetVehicleItemDto {
  @ApiProperty({ type: FleetAssignmentDto })
  assignment!: FleetAssignmentDto;

  @ApiProperty({ type: FleetVehicleDto })
  vehicle!: FleetVehicleDto;
}

export class FleetResponseDto {
  @ApiProperty({ format: 'uuid', example: '3b6db25b-62df-4f65-9a15-24f75bff2a12' })
  userId!: string;

  @ApiProperty({ example: 2 })
  total!: number;

  @ApiProperty({ type: [FleetVehicleItemDto] })
  vehicles!: FleetVehicleItemDto[];
}
