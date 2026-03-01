import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryRepositoryPort } from '../../application/ports/delivery.repository.port';
import { UpdateDeliveryStatusDto } from '../dto/delivery.dto';

@Controller('api/deliveries')
@ApiTags('deliveries')
export class DeliveriesController {
  constructor(
    @Inject(DeliveryRepositoryPort)
    private readonly deliveryRepository: DeliveryRepositoryPort,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by id' })
  async findById(@Param('id') id: string) {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new HttpException(
        { success: false, code: 'DELIVERY_NOT_FOUND', message: 'Delivery not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return { success: true, data: delivery };
  }

  @Get('transaction/:transactionReference')
  @ApiOperation({ summary: 'Get delivery by transaction reference' })
  async findByTransactionReference(
    @Param('transactionReference') transactionReference: string,
  ) {
    const delivery = await this.deliveryRepository.findByTransactionReference(
      transactionReference,
    );
    if (!delivery) {
      throw new HttpException(
        { success: false, code: 'DELIVERY_NOT_FOUND', message: 'Delivery not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return { success: true, data: delivery };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update delivery status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateDeliveryStatusDto,
  ) {
    const delivery = await this.deliveryRepository.updateStatus(id, body.status);
    if (!delivery) {
      throw new HttpException(
        { success: false, code: 'DELIVERY_NOT_FOUND', message: 'Delivery not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return { success: true, data: delivery };
  }
}
