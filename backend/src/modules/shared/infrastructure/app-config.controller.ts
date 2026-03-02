import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppConfigResponseDto } from './dto/app-config.dto';

@Controller('api/app')
@ApiTags('app')
export class AppConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('config')
  @ApiOperation({
    summary: 'Get public checkout app configuration',
  })
  @ApiOkResponse({ type: AppConfigResponseDto })
  getConfig(): AppConfigResponseDto {
    const currency = this.configService.get<string>('APP_CURRENCY', 'COP');
    const baseFee = Number(this.configService.get<string>('APP_BASE_FEE', '2500'));
    const deliveryFee = Number(
      this.configService.get<string>('APP_DELIVERY_FEE', '5000'),
    );

    return {
      success: true,
      data: {
        currency,
        baseFee: Number.isFinite(baseFee) ? baseFee : 2500,
        deliveryFee: Number.isFinite(deliveryFee) ? deliveryFee : 5000,
      },
    };
  }
}
