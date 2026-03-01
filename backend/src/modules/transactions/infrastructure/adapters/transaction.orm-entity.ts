import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TransactionStatus,
  PaymentMethod,
} from '../../domain/transaction.entity';

@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column('integer')
  quantity: number;

  @Column('integer')
  amount: number;

  @Column('integer', { name: 'base_fee' })
  baseFee: number;

  @Column('integer', { name: 'delivery_fee' })
  deliveryFee: number;

  @Column('integer', { name: 'total_amount' })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'external_transaction_id', nullable: true })
  externalTransactionId: string;

  @Column({ name: 'external_reference', nullable: true })
  externalReference: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
