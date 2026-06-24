import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TransferAssignmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;
}
