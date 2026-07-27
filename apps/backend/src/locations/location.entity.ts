import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductionOrder } from '../production-orders/production-order.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: string;
  @Column({ length: 100 }) name!: string;
  @Column({ length: 100 }) city!: string;
  @Column({ type: 'text', nullable: true }) address!: string | null;
  @Column({ name: 'is_active', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @OneToMany(() => ProductionOrder, (order) => order.location) orders!: ProductionOrder[];
}
