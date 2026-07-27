import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ProductionOrder } from '../production-orders/production-order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: string;
  @Column({ name: 'business_name', length: 200 }) businessName!: string;
  @Column({ name: 'trade_name', type: 'varchar', length: 200, nullable: true }) tradeName!: string | null;
  @Column({ name: 'tax_id', type: 'varchar', length: 20, nullable: true }) taxId!: string | null;
  @Column({ type: 'text', nullable: true }) address!: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) city!: string | null;
  @Column({ type: 'varchar', length: 50, nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', length: 200, nullable: true }) email!: string | null;
  @Column({ name: 'contact_name', type: 'varchar', length: 200, nullable: true }) contactName!: string | null;
  @Column({ name: 'logo_path', type: 'text', nullable: true }) logoPath!: string | null;
  @Column({ name: 'is_default', default: false }) isDefault!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @OneToMany(() => ProductionOrder, (order) => order.customer) orders!: ProductionOrder[];
}
