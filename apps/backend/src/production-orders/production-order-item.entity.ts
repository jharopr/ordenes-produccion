import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductionOrder } from './production-order.entity';

@Entity('production_order_items')
export class ProductionOrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: string;
  @Column({ name: 'production_order_id', type: 'bigint' }) productionOrderId!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) quantity!: string;
  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 }) unitPrice!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) subtotal!: string;
  @Column({ name: 'display_order', type: 'integer', default: 0 }) displayOrder!: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @ManyToOne(() => ProductionOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_order_id' }) productionOrder!: ProductionOrder;
}
