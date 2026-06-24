import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentAuditAction } from '../entities/assignment-audit-event.entity';

export class AuditEventResponseDto {
  @ApiProperty({ format: 'uuid', example: 'f5aa8f56-2115-4d4f-a1b7-75b8f91f9b24' })
  id!: string;

  @ApiProperty({ format: 'uuid', example: '3b6db25b-62df-4f65-9a15-24f75bff2a12' })
  userId!: string;

  @ApiProperty({ format: 'uuid', example: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316' })
  vehicleId!: string;

  @ApiProperty({ enum: AssignmentAuditAction, example: AssignmentAuditAction.CREACION })
  action!: AssignmentAuditAction;

  @ApiProperty({ format: 'date-time', example: '2026-06-24T14:45:00.000Z' })
  timestamp!: Date;

  @ApiProperty({ format: 'uuid', example: '3b6db25b-62df-4f65-9a15-24f75bff2a12' })
  actorUserId!: string;

  @ApiProperty({ example: 'admin' })
  actorUsername!: string;

  @ApiProperty({ example: 'ADMIN' })
  actorRoles!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: { userId: '3b6db25b-62df-4f65-9a15-24f75bff2a12', vehicleId: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316', status: 'INACTIVE' },
  })
  beforePayload!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    example: { userId: '3b6db25b-62df-4f65-9a15-24f75bff2a12', vehicleId: 'd72f78e1-f3de-4a8f-91f4-568c2cb9b316', status: 'ACTIVE' },
  })
  afterPayload!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true, example: '9e50f3ec-2e2b-4e37-bf5f-df4be84004bd' })
  requestId!: string | null;
}
