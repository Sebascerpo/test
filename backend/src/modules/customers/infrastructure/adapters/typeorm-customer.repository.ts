import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerRepositoryPort } from '../../application/ports/customer.repository.port';
import { Customer, DeliveryInfo } from '../../domain/customer.entity';
import { CustomerOrmEntity } from './customer.orm-entity';

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repository: Repository<CustomerOrmEntity>,
  ) {}

  async create(input: DeliveryInfo): Promise<Customer> {
    const customer = this.repository.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      postalCode: input.postalCode,
    });
    const saved = await this.repository.save(customer);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.repository.findOne({ where: { id } });
    return customer ? this.toDomain(customer) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.repository.findOne({ where: { email } });
    return customer ? this.toDomain(customer) : null;
  }

  private toDomain(entity: CustomerOrmEntity): Customer {
    return {
      id: entity.id,
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      city: entity.city,
      postalCode: entity.postalCode,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
