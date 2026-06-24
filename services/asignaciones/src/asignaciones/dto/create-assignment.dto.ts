import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solo ADMIN puede indicar userId. USER siempre usa el sub del JWT.',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vehicleId!: string;
}
