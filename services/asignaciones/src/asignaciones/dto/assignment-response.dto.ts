import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../entities/vehicle-assignment.entity';

export class AssignmentResponseDto {
  @ApiProperty({ format: 'uuid', example: '3b6db25b-62df-4f65-9a15-24f75bff2a12' })
  userId!: string;

  @ApiProperty({ format: 'uuid', example: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316' })
  vehicleId!: string;

  @ApiProperty({ enum: AssignmentStatus, example: AssignmentStatus.ACTIVE })
  status!: AssignmentStatus;

  @ApiProperty({ format: 'date-time', example: '2026-06-24T14:45:00.000Z' })
  assignedAt!: Date;

  @ApiPropertyOptional({ format: 'date-time', nullable: true, example: null })
  unassignedAt!: Date | null;

  @ApiProperty({ format: 'date-time', example: '2026-06-24T14:45:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time', example: '2026-06-24T14:45:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ format: 'uuid', example: '3b6db25b-62df-4f65-9a15-24f75bff2a12' })
  createdBy!: string;

  @ApiProperty({ format: 'uuid', example: '3b6db25b-62df-4f65-9a15-24f75bff2a12' })
  updatedBy!: string;
}
