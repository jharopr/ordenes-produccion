import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { Location } from '../locations/location.entity';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { ProductionOrderItem } from './production-order-item.entity';

export enum ProductionOrderStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: string;
  @Column({ name: 'order_number', length: 50, unique: true }) orderNumber!: string;
  @Column({ name: 'customer_id', type: 'bigint' }) customerId!: string;
  @Column({ name: 'location_id', type: 'bigint', nullable: true }) locationId!: string | null;
  @Column({ length: 250 }) title!: string;
  @Column({ name: 'execution_address', type: 'text', nullable: true }) executionAddress!: string | null;
  @Column({ name: 'start_date', type: 'date', nullable: true }) startDate!: string | null;
  @Column({ name: 'estimated_completion_date', type: 'date', nullable: true }) estimatedCompletionDate!: string | null;
  @Column({ name: 'completion_date', type: 'date', nullable: true }) completionDate!: string | null;
  @Column({ type: 'enum', enum: ProductionOrderStatus, enumName: 'production_order_status', default: ProductionOrderStatus.DRAFT })
  status!: ProductionOrderStatus;
  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, enumName: 'payment_status', default: PaymentStatus.UNPAID })
  paymentStatus!: PaymentStatus;
  @Column({ name: 'requested_by', type: 'varchar', length: 200, nullable: true }) requestedBy!: string | null;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) subtotal!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) discount!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) total!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @ManyToOne(() => Customer, (customer) => customer.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' }) customer!: Customer;
  @ManyToOne(() => Location, (location) => location.orders, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' }) location!: Location | null;
  @OneToMany(() => ProductionOrderItem, (item) => item.productionOrder, { cascade: true }) items!: ProductionOrderItem[];
  @OneToMany(() => Invoice, (invoice) => invoice.productionOrder, { cascade: true }) invoices!: Invoice[];
  @OneToMany(() => Payment, (payment) => payment.productionOrder) payments!: Payment[];
}
