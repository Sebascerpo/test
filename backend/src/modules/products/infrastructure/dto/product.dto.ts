// DTOs for Products API
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateStockDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
