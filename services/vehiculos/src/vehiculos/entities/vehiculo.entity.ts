import { Column, Entity, PrimaryGeneratedColumn, TableInheritance } from "typeorm";

export enum Clasificacion{
    ELECTRICO = "Electrico",
    HIBRIDO = "Hibrido",
    GASOLINA = "Gasolina",
}

@Entity()
@TableInheritance({ column: { type: "varchar", name: "tipo" } })

export abstract class Vehiculo {
    @PrimaryGeneratedColumn("uuid")
    id!:string;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId!: string;

    @Column()
    placa!: string;

    @Column()
    marca!: string;

    @Column()
    modelo!: string;

    @Column()
    color!: string;

    @Column()
    anio!: number;

    @Column({type: "enum", enum: Clasificacion})
    clasificacion!: Clasificacion;

    abstract obtenerTipo(): string;
}
