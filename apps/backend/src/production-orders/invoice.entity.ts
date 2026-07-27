import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductionOrder } from './production-order.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: string;
  @Column({ name: 'production_order_id', type: 'bigint' }) productionOrderId!: string;
  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true }) invoiceNumber!: string | null;
  @Column({ name: 'issue_date', type: 'date', nullable: true }) issueDate!: string | null;
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true }) amount!: string | null;
  @Column({ name: 'storage_path', type: 'text', nullable: true }) storagePath!: string | null;
  @Column({ name: 'original_filename', type: 'text', nullable: true }) originalFilename!: string | null;
  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true }) mimeType!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @ManyToOne(() => ProductionOrder, (order) => order.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_order_id' }) productionOrder!: ProductionOrder;
}
