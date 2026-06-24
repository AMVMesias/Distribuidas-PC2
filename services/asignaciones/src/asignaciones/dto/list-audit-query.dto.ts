import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AssignmentAuditAction } from '../entities/assignment-audit-event.entity';

export class ListAuditQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ enum: AssignmentAuditAction })
  @IsOptional()
  @IsEnum(AssignmentAuditAction)
  action?: AssignmentAuditAction;
}
