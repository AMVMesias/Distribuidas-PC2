import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity({name: 'evento_auditoria'})
export class EventoAuditoria {

    @PrimaryGeneratedColumn()
    id!: string;

    @Column({type: 'varchar', length: 20})
    servicio!: string;

    @Column({type: 'varchar', length: 15})
    accion!: string;

    //toca ser jwt
    @Column({type: 'varchar', length: 100})
    username!: string;

    @Column({ type: 'jsonb', nullable: true })
    datos?: any;

    @Column({type: 'varchar', length: 100})
    rol?: string;

    @Column({type: 'varchar', length: 100})
    entidad!: string;

    @Column({type: 'varchar', length: 15})
    ip!: string; //ejn. 192.168.2.15

    @Column({type: 'varchar', length: 17, nullable: true})
    mac?: string;

    @Column()
    timestamp!: Date;

}