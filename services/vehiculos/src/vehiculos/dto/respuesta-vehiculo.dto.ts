export class RespuestaVehiculoDto {
    id!: string;
    placa!: string;
    marca!: string;
    modelo!: string;
    anio!: number;
    color!: string;
    clasificacion!: string;
    tipo!: string;
    capacidadCarga?: number;
    numeroPuertas?: number;
}
