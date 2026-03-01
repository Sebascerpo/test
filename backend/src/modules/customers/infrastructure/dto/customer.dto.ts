import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertCustomerDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(7)
  phone: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsString()
  @MinLength(5)
  address: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  postalCode: string;
}
