import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAsignacionesSchema1720000000000 implements MigrationInterface {
  name = 'InitialAsignacionesSchema1720000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "assignment_status_enum" AS ENUM ('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(`CREATE TYPE "assignment_audit_action_enum" AS ENUM ('CREACION', 'MODIFICACION', 'ELIMINACION')`);
    await queryRunner.query(`CREATE TABLE "vehicle_assignment" (
      "user_id" uuid NOT NULL,
      "vehicle_id" uuid NOT NULL,
      "status" "assignment_status_enum" NOT NULL DEFAULT 'ACTIVE',
      "assigned_at" timestamptz NOT NULL DEFAULT now(),
      "unassigned_at" timestamptz,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "created_by" uuid NOT NULL,
      "updated_by" uuid NOT NULL,
      CONSTRAINT "PK_vehicle_assignment" PRIMARY KEY ("user_id", "vehicle_id")
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_vehicle_assignment_active_vehicle" ON "vehicle_assignment" ("vehicle_id") WHERE "status" = 'ACTIVE'`);
    await queryRunner.query(`CREATE INDEX "IDX_vehicle_assignment_user_status" ON "vehicle_assignment" ("user_id", "status")`);
    await queryRunner.query(`CREATE TABLE "assignment_audit_event" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL,
      "vehicle_id" uuid NOT NULL,
      "action" "assignment_audit_action_enum" NOT NULL,
      "timestamp" timestamptz NOT NULL DEFAULT now(),
      "actor_user_id" uuid NOT NULL,
      "actor_username" varchar NOT NULL,
      "actor_roles" text NOT NULL,
      "before_payload" jsonb,
      "after_payload" jsonb,
      "request_id" varchar,
      CONSTRAINT "PK_assignment_audit_event" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_assignment_audit_event_assignment" ON "assignment_audit_event" ("user_id", "vehicle_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assignment_audit_event_timestamp" ON "assignment_audit_event" ("timestamp")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "assignment_audit_event"`);
    await queryRunner.query(`DROP INDEX "IDX_vehicle_assignment_user_status"`);
    await queryRunner.query(`DROP INDEX "UQ_vehicle_assignment_active_vehicle"`);
    await queryRunner.query(`DROP TABLE "vehicle_assignment"`);
    await queryRunner.query(`DROP TYPE "assignment_audit_action_enum"`);
    await queryRunner.query(`DROP TYPE "assignment_status_enum"`);
  }
}
