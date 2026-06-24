import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum AssignmentAuditAction {
  CREACION = 'CREACION',
  MODIFICACION = 'MODIFICACION',
  ELIMINACION = 'ELIMINACION',
}

@Entity({ name: 'assignment_audit_event' })
export class AssignmentAuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'enum', enum: AssignmentAuditAction })
  action!: AssignmentAuditAction;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId!: string;

  @Column({ name: 'actor_username' })
  actorUsername!: string;

  @Column({ name: 'actor_roles' })
  actorRoles!: string;

  @Column({ name: 'before_payload', type: 'jsonb', nullable: true })
  beforePayload!: Record<string, unknown> | null;

  @Column({ name: 'after_payload', type: 'jsonb', nullable: true })
  afterPayload!: Record<string, unknown> | null;

  @Column({ name: 'request_id', nullable: true })
  requestId!: string | null;
}
