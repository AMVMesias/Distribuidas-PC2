import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ format: 'uuid', description: 'ID del espacio que se ocupará' })
  @IsUUID()
  idEspacio!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'ID del vehículo. Obligatorio si no se envía placa.' })
  @IsOptional()
  @IsUUID()
  idVehiculo?: string;

  @ApiPropertyOptional({ example: 'ABC-1234', description: 'Placa del vehículo. Obligatoria si no se envía idVehiculo.' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}-\d{4}$/i, { message: 'La placa debe tener el formato ABC-1234' })
  placa?: string;
}
