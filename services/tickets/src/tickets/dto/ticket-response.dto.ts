import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../entities/ticket.entity';

export class TicketResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'TICK-AM-20260701123045-A1B2' })
  codigo!: string;

  @ApiProperty({ format: 'uuid' })
  idEspacio!: string;

  @ApiProperty({ format: 'uuid' })
  idUsuario!: string;

  @ApiProperty({ format: 'uuid' })
  idVehiculo!: string;

  @ApiProperty({ example: 'ABC-1234' })
  placaVehiculo!: string;

  @ApiProperty({ format: 'date-time' })
  fechaHoraIngreso!: Date;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  fechaHoraSalida!: Date | null;

  @ApiProperty({ enum: TicketStatus })
  estado!: TicketStatus;

  @ApiProperty({ format: 'uuid' })
  idEmpleado!: string;

  @ApiProperty({ example: '0.50' })
  valorRecaudado!: string;

  @ApiProperty({ example: 'AUTO' })
  tipoVehiculo!: string;

  @ApiProperty({ example: 'AUTO' })
  tipoEspacio!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
