import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'evento_auditoria'})
export class EventoAuditoria {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type: 'varchar', length: 50})
    servicio!: string;

    @Column({type: 'varchar', length: 10})
    accion!: string;

    @Column({type: 'varchar', length: 100})
    username!: string;

    @Column({ type: 'jsonb', nullable: true })
    datos?: Record<string, unknown>;

    @Column({type: 'varchar', length: 100})
    rol?: string;

    @Column({type: 'varchar', length: 50})
    entidad!: string;

    @Column({type: 'varchar', length: 45})
    ip!: string;

    @Column({type: 'varchar', length: 17, nullable: true})
    mac?: string;

    @Column({ type: 'timestamptz' })
    timestamp!: Date;

}
