import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1719000000000 implements MigrationInterface {
  name = 'InitialSchema1719000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "vehiculo_clasificacion_enum" AS ENUM ('Electrico', 'Hibrido', 'Gasolina')`);
    await queryRunner.query(`CREATE TYPE "vehiculo_tipo_moto_enum" AS ENUM ('Deportiva', 'Scooter', 'Motocross')`);
    await queryRunner.query(`CREATE TABLE "vehiculo" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "owner_id" uuid NOT NULL,
      "placa" varchar NOT NULL,
      "marca" varchar NOT NULL,
      "modelo" varchar NOT NULL,
      "color" varchar NOT NULL,
      "anio" integer NOT NULL,
      "clasificacion" "vehiculo_clasificacion_enum" NOT NULL,
      "numeroPuertas" integer,
      "capacidadMaletero" integer,
      "tipo_moto" "vehiculo_tipo_moto_enum",
      "capacidadCarga" integer,
      "traccion" varchar,
      "tipo" varchar NOT NULL,
      CONSTRAINT "PK_vehiculo" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_vehiculo_placa" UNIQUE ("placa")
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_vehiculo_owner" ON "vehiculo" ("owner_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vehiculo"`);
    await queryRunner.query(`DROP TYPE "vehiculo_tipo_moto_enum"`);
    await queryRunner.query(`DROP TYPE "vehiculo_clasificacion_enum"`);
  }
}
