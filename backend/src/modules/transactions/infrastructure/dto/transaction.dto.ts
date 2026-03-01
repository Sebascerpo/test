// DTOs for Transactions API
import {
  IsString,
  IsNumber,
  IsEmail,
  Min,
  IsOptional,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryInfoDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  postalCode: string;
}

export class CardInfoDto {
  @Matches(/^[0-9]{13,19}$/, { message: 'Invalid card number' })
  number: string;

  @Matches(/^[0-9]{3,4}$/, { message: 'Invalid CVV' })
  cvv: string;

  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Invalid expiry month' })
  expMonth: string;

  @Matches(/^[0-9]{2}$/, { message: 'Invalid expiry year' })
  expYear: string;

  @IsString()
  cardHolder: string;
}

export class ProcessPaymentDto {
  @IsOptional()
  @Matches(/^TX-[A-Z0-9-]{6,80}$/, {
    message: 'Invalid transaction reference',
  })
  reference?: string;

  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @ValidateNested()
  @Type(() => DeliveryInfoDto)
  deliveryInfo: DeliveryInfoDto;

  @ValidateNested()
  @Type(() => CardInfoDto)
  cardInfo: CardInfoDto;
}

export class TransactionResponseDto {
  success: boolean;
  transaction: {
    id: string;
    reference: string;
    status: string;
    amount: number;
    baseFee: number;
    deliveryFee: number;
    totalAmount: number;
    productId: string;
    createdAt: Date;
    deliveryId?: string;
    externalTransactionId?: string;
    errorMessage?: string;
  };
  message: string;
}

export class SyncTransactionResponseDto {
  success: boolean;
  transaction: TransactionResponseDto['transaction'] | null;
  updated: boolean;
  retryable?: boolean;
  reason?: 'NOT_FOUND_YET' | null;
  deliveryId?: string;
}

export class CreateTransactionDto {
  @IsString()
  productId: string;

  @IsString()
  customerId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  baseFee: number;

  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}
