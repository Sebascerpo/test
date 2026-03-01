import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeliveryStatus } from '../../domain/delivery.entity';

@Entity('deliveries')
export class DeliveryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'transaction_id', unique: true })
  transactionId: string;

  @Column({ type: 'varchar', name: 'transaction_reference', unique: true })
  transactionReference: string;

  @Column({ type: 'varchar', name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', name: 'customer_id' })
  customerId: string;

  @Column({ name: 'address_snapshot', type: 'text' })
  addressSnapshot: string;

  @Column({ type: 'varchar', name: 'city_snapshot' })
  citySnapshot: string;

  @Column({ type: 'varchar', name: 'postal_code_snapshot', nullable: true })
  postalCodeSnapshot: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.ASSIGNED,
  })
  status: DeliveryStatus;

  @Column({ name: 'assigned_at', type: 'timestamp' })
  assignedAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
