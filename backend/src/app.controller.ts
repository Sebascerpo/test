import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/products')
  getProducts() {
    return {
      success: true,
      data: [
        {
          id: '1',
          name: 'iPhone 15 Pro',
          description: 'The ultimate iPhone with titanium design.',
          price: 5499900,
          stock: 15,
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=2560&hei=1440&fmt=p-jpg&qlt=80&.v=1692846114654',
        },
        {
          id: '2',
          name: 'MacBook Air M3',
          description: 'Supercharged by M3, incredibly thin and fast.',
          price: 6299900,
          stock: 8,
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-m3-spacegray-selection-202403?wid=452&hei=420&fmt=jpeg&qlt=95&.v=1707847631321',
        },
        {
          id: '3',
          name: 'AirPods Pro (2nd Gen)',
          description:
            'Magical listening experience with active noise cancellation.',
          price: 1299900,
          stock: 25,
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=1144&hei=1144&fmt=jpeg&qlt=95&.v=1694014871985',
        },
      ],
    };
  }

  @Post('api/payment/process')
  processPayment(@Body() body: any) {
    return {
      success: true,
      transaction: {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        reference: 'REF-' + Date.now(),
        status: 'APPROVED',
        totalAmount: body.amount || 0,
        wompiTransactionId: 'wompi_' + Math.random().toString(36).substr(2, 9),
      },
    };
  }
}
