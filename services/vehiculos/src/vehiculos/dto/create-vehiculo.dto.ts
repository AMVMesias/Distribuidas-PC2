import { Type } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength, IsInt, IsNumber, Min, Max, ValidateNested, IsIn, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Clasificacion } from "../entities/vehiculo.entity";
import { TipoMoto } from "../entities/motocicleta.entity";

export class BaseVehiculoDto {

    @ApiProperty({ example: 'ABC-1234', description: 'Placa con formato ABC-1234' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[A-Z]{3}-\d{4}$/,{ message: "La placa debe tener el formato ABC-1234" })
    placa!: string;

    @ApiProperty({ example: 'Toyota' })
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: "La marca debe tener al menos 2 caracteres" })
    @MaxLength(30, { message: "La marca no puede tener más de 30 caracteres" })
    @Matches(/^[a-zA-Z\s\-accents]+$/, { message: "La marca solo puede contener letras, espacios y guiones" })
    marca!: string;

    @ApiProperty({ example: 'Corolla' })
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: "El modelo debe tener al menos 2 caracteres" })
    @MaxLength(150, { message: "El modelo no puede tener más de 150 caracteres" })
    @Matches(/^[a-zA-Z0-9\s\-accents]+$/, { message: "El modelo solo puede contener letras, números, espacios y guiones" })
    modelo!: string;

    @ApiProperty({ example: 'Gris' })
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: "El color debe tener al menos 2 caracteres" })
    @MaxLength(30, { message: "El color no puede tener más de 30 caracteres" })
    @Matches(/^[a-zA-Z\s\-accents]+$/, { message: "El color solo puede contener letras, espacios y guiones" })
    color!: string;

    @ApiProperty({ example: 2022, minimum: 1886 })
    @Min(1886, { message: "El año debe ser mayor o igual a 1886" })
    @IsInt({ message: "El año debe ser un número entero" })
    @IsNumber({}, { message: "El año debe ser un número" })
    anio!: number;

    @ApiProperty({ enum: Clasificacion, enumName: 'Clasificacion' })
    @IsNotEmpty({ message: "La clasificación es obligatoria" })
    @IsEnum(Clasificacion, { message: "La clasificación debe ser Electrico, Hibrido o Gasolina" })
    clasificacion!: Clasificacion;
}

export class AutoDto extends BaseVehiculoDto {
    @ApiProperty({ example: 4, minimum: 2, maximum: 4 })
    @IsNotEmpty({ message: "El número de puertas es obligatorio" })
    @IsInt({ message: "El número de puertas debe ser un número entero" })
    @Min(2, { message: "El número de puertas debe ser al menos 2" })
    @Max(4, { message: "El número de puertas no puede ser mayor a 4" })
    @IsNumber({}, { message: "El número de puertas debe ser un número" })
    numeroPuertas!: number;

    @ApiProperty({ example: 470, minimum: 0, maximum: 2000, description: 'Capacidad del maletero en litros' })
    @IsNotEmpty({ message: "La capacidad del maletero es obligatoria" })
    @IsInt({ message: "La capacidad del maletero debe ser un número entero" })
    @Min(0, { message: "La capacidad del maletero debe ser al menos 0 litros" })
    @Max(2000, { message: "La capacidad del maletero no puede ser mayor a 2000 litros" })
    @IsNumber({}, { message: "La capacidad del maletero debe ser un número" })
    capacidadMaletero!: number;
}


export class MotocicletaDto extends BaseVehiculoDto {
    @ApiProperty({ enum: TipoMoto, enumName: 'TipoMoto' })
    @IsEnum(TipoMoto, { message: 'El tipo de moto debe ser Deportiva, Scooter o Motocross' })
    tipoMoto!: TipoMoto;
}

export class CamionetaDto extends BaseVehiculoDto {
    @ApiProperty({ example: 800, minimum: 0, maximum: 20000, description: 'Capacidad de carga en kg' })
    @IsNotEmpty({ message: "La capacidad de carga es obligatoria" })
    @IsNumber({}, { message: "La capacidad de carga debe ser un número" })
    @Min(0, { message: "La capacidad de carga debe ser al menos 0 kg" })
    @Max(20000, { message: "La capacidad de carga no puede ser mayor a 20000 kg" })
    capacidadCarga!: number;

    @ApiProperty({ enum: ['4x2', '4x4', 'AWD'] })
    @IsNotEmpty({ message: "El tipo de tracción es obligatorio" })
    @IsString()
    @IsIn(['4x2', '4x4', 'AWD'])
    traccion!: string;
}

export class CreateVehiculoDto {
  @ApiProperty({ enum: ['auto', 'motocicleta', 'camioneta'] })
  @IsIn(['auto', 'motocicleta', 'camioneta'])
  tipo!: string;

  @ApiProperty({
    description: 'Datos del vehículo. La forma depende del campo "tipo".',
    oneOf: [
      { $ref: '#/components/schemas/AutoDto' },
      { $ref: '#/components/schemas/MotocicletaDto' },
      { $ref: '#/components/schemas/CamionetaDto' },
    ],
  })
  @ValidateNested()
  @Type((opts) => {
    const object = opts?.object as CreateVehiculoDto;
    if (!object) return BaseVehiculoDto;

    switch (object.tipo) {
      case 'auto':
        return AutoDto;
      case 'motocicleta':
        return MotocicletaDto;
      case 'camioneta':
        return CamionetaDto;
      default:
        return BaseVehiculoDto;
    }
  })
  datos!: AutoDto | MotocicletaDto | CamionetaDto;
}
