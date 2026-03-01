import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerRepositoryPort } from '../../application/ports/customer.repository.port';
import { UpsertCustomerDto } from '../dto/customer.dto';
import {
  createCustomerUseCase,
  CreateCustomerUseCase,
} from '../../application/use-cases/create-customer.use-case';

@Controller('api/customers')
@ApiTags('customers')
export class CustomersController {
  private readonly upsertCustomerUseCase: CreateCustomerUseCase;

  constructor(
    @Inject(CustomerRepositoryPort)
    private readonly customerRepository: CustomerRepositoryPort,
  ) {
    this.upsertCustomerUseCase = createCustomerUseCase(customerRepository);
  }

  @Post()
  @ApiOperation({ summary: 'Create or upsert a customer delivery profile' })
  async upsert(@Body() body: UpsertCustomerDto) {
    const result = await this.upsertCustomerUseCase({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      postalCode: body.postalCode,
    });

    if (!result.success) {
      throw new HttpException(
        { success: false, code: 'CUSTOMER_UPSERT_FAILED', message: result.error.message },
        HttpStatus.BAD_REQUEST,
      );
    }

    return { success: true, data: result.value };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id' })
  async findById(@Param('id') id: string) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new HttpException(
        { success: false, code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return { success: true, data: customer };
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get customer by email' })
  async findByEmail(@Param('email') email: string) {
    const customer = await this.customerRepository.findByEmail(email);
    if (!customer) {
      throw new HttpException(
        { success: false, code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return { success: true, data: customer };
  }
}
