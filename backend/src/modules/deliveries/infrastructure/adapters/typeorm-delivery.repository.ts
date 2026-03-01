import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryRepositoryPort } from '../../application/ports/delivery.repository.port';
import {
  Delivery,
  DeliveryCreateInput,
  DeliveryStatus,
} from '../../domain/delivery.entity';
import { DeliveryOrmEntity } from './delivery.orm-entity';

@Injectable()
export class TypeOrmDeliveryRepository implements DeliveryRepositoryPort {
  constructor(
    @InjectRepository(DeliveryOrmEntity)
    private readonly repository: Repository<DeliveryOrmEntity>,
  ) {}

  async create(input: DeliveryCreateInput): Promise<Delivery> {
    const entity = this.repository.create({
      ...input,
      assignedAt: input.assignedAt ?? new Date(),
      deliveredAt: null,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Delivery | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTransactionId(transactionId: string): Promise<Delivery | null> {
    const entity = await this.repository.findOne({ where: { transactionId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTransactionReference(
    transactionReference: string,
  ): Promise<Delivery | null> {
    const entity = await this.repository.findOne({
      where: { transactionReference },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async updateStatus(
    id: string,
    status: DeliveryStatus,
    deliveredAt?: Date | null,
  ): Promise<Delivery | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;

    entity.status = status;
    if (typeof deliveredAt !== 'undefined') {
      entity.deliveredAt = deliveredAt;
    } else if (status === DeliveryStatus.DELIVERED) {
      entity.deliveredAt = new Date();
    }

    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: DeliveryOrmEntity): Delivery {
    return {
      id: entity.id,
      transactionId: entity.transactionId,
      transactionReference: entity.transactionReference,
      productId: entity.productId,
      customerId: entity.customerId,
      addressSnapshot: entity.addressSnapshot,
      citySnapshot: entity.citySnapshot,
      postalCodeSnapshot: entity.postalCodeSnapshot,
      status: entity.status,
      assignedAt: entity.assignedAt,
      deliveredAt: entity.deliveredAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
