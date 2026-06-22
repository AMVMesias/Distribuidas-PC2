import { ChildEntity, Column } from "typeorm";
import { Vehiculo } from "./vehiculo.entity";

@ChildEntity("Camioneta")
export class Camioneta extends Vehiculo {
    @Column()
    capacidadCarga!: number;

    @Column()
    traccion!: string;

    obtenerTipo(): string {
        return "Camioneta";
    }
}
