import { ApiProperty } from '@nestjs/swagger';

export class AppConfigDataDto {
  @ApiProperty({ example: 'COP' })
  currency!: string;

  @ApiProperty({ example: 2500 })
  baseFee!: number;

  @ApiProperty({ example: 5000 })
  deliveryFee!: number;
}

export class AppConfigResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: AppConfigDataDto })
  data!: AppConfigDataDto;
}
