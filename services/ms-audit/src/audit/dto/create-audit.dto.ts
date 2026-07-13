import {
  IsIP,
  IsMACAddress,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsIn,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAuditEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(50)
  @Matches(/^ms-[a-z0-9-]+$/i, {
    message: 'El servicio debe comenzar con "ms-".',
  })
  servicio!: string; //ms-users , ms-auth, ms-products, etc.

  @IsString()
  @IsNotEmpty()
  @IsIn(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SELECT'])
  accion!: string; //CREATE - UPDATE - DELETE - LOGIN - LOGOUT - SELECT

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_-]*$/, {
    message: 'La entidad debe usar mayúsculas, números, guiones o guiones bajos.',
  })
  entidad!: string; //ROL-USUARIO (SI SON COMPUESTAS)

  @IsObject()
  @IsOptional()
  datos?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  usuario!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  rol!: string;

  @IsIP(undefined, { message: 'La dirección IP debe ser válida.' })
  @IsNotEmpty()
  ip!: string;

  @IsMACAddress({
    message: 'La dirección MAC debe ser una dirección MAC válida.',
  })
  @IsOptional()
  mac?: string;
}
