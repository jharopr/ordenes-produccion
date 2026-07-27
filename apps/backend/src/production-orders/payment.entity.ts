import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductionOrder } from './production-order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: string;
  @Column({ name: 'production_order_id', type: 'bigint' }) productionOrderId!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) amount!: string;
  @Column({ name: 'paid_at', type: 'timestamptz', default: () => 'now()' }) paidAt!: Date;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @ManyToOne(() => ProductionOrder, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_order_id' }) productionOrder!: ProductionOrder;
}
