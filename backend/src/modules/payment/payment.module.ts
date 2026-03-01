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
        baseUrl: configService.get<string>('PAYMENT_BASE_URL', ''),
        publicKey: configService.get<string>('PAYMENT_PUBLIC_KEY', ''),
        privateKey: configService.get<string>('PAYMENT_PRIVATE_KEY', ''),
        integrityKey: configService.get<string>('PAYMENT_INTEGRITY_KEY', ''),
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
