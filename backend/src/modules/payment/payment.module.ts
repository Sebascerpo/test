import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  PaymentGatewayPort,
  PaymentConfig,
} from './application/ports/payment-gateway.port';
import { PaymentGatewayAdapter } from './infrastructure/adapters/payment-gateway.adapter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PaymentConfig,
      useFactory: (configService: ConfigService) => ({
        baseUrl: configService.get<string>('EXTERNAL_PROVIDER_BASE_URL', ''),
        publicKey: configService.get<string>(
          'EXTERNAL_PROVIDER_PUBLIC_KEY',
          '',
        ),
        privateKey: configService.get<string>(
          'EXTERNAL_PROVIDER_PRIVATE_KEY',
          '',
        ),
        integrityKey: configService.get<string>(
          'EXTERNAL_PROVIDER_INTEGRITY_KEY',
          '',
        ),
        currency: configService.get<string>('APP_CURRENCY', 'COP'),
        baseFee: parseInt(
          configService.get<string>('APP_BASE_FEE', '2500'),
          10,
        ),
        deliveryFee: parseInt(
          configService.get<string>('APP_DELIVERY_FEE', '5000'),
          10,
        ),
      }),
      inject: [ConfigService],
    },
    {
      provide: PaymentGatewayPort,
      useClass: PaymentGatewayAdapter,
    },
  ],
  exports: [PaymentGatewayPort],
})
export class PaymentModule {}
