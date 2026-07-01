import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialTicketsSchema1730000000000 implements MigrationInterface {
  name = 'InitialTicketsSchema1730000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "tickets_estado_enum" AS ENUM ('ACTIVO', 'PAGADO', 'CANCELADO')`);
    await queryRunner.query(`CREATE TABLE "tickets" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "codigo" varchar(64) NOT NULL,
      "id_espacio" uuid NOT NULL,
      "id_usuario" uuid NOT NULL,
      "id_vehiculo" uuid NOT NULL,
      "placa_vehiculo" varchar(16) NOT NULL,
      "fecha_hora_ingreso" timestamptz NOT NULL DEFAULT now(),
      "fecha_hora_salida" timestamptz,
      "estado" "tickets_estado_enum" NOT NULL DEFAULT 'ACTIVO',
      "id_empleado" uuid NOT NULL,
      "valor_recaudado" numeric(10,2) NOT NULL DEFAULT 0,
      "tipo_vehiculo" varchar(32) NOT NULL,
      "tipo_espacio" varchar(32) NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_tickets" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_tickets_codigo" UNIQUE ("codigo")
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_tickets_active_vehicle" ON "tickets" ("id_vehiculo") WHERE "estado" = 'ACTIVO'`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_usuario" ON "tickets" ("id_usuario")`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_espacio" ON "tickets" ("id_espacio")`);
    await queryRunner.query(`CREATE INDEX "IDX_tickets_estado" ON "tickets" ("estado")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_tickets_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_tickets_espacio"`);
    await queryRunner.query(`DROP INDEX "IDX_tickets_usuario"`);
    await queryRunner.query(`DROP INDEX "UQ_tickets_active_vehicle"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TYPE "tickets_estado_enum"`);
  }
}
