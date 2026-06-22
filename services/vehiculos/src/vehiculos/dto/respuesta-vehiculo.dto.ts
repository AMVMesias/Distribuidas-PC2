import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespuestaVehiculoDto {
    @ApiProperty({ format: 'uuid' })
    id!: string;

    @ApiProperty({ example: 'ABC-1234' })
    placa!: string;

    @ApiProperty()
    marca!: string;

    @ApiProperty()
    modelo!: string;

    @ApiProperty()
    anio!: number;

    @ApiProperty()
    color!: string;

    @ApiProperty({ enum: ['Electrico', 'Hibrido', 'Gasolina'] })
    clasificacion!: string;

    @ApiProperty({ enum: ['auto', 'motocicleta', 'camioneta'] })
    tipo!: string;

    @ApiPropertyOptional()
    capacidadCarga?: number;

    @ApiPropertyOptional()
    numeroPuertas?: number;
}
