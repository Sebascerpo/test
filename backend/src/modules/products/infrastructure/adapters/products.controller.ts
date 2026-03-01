// Products Controller
import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  createGetAllProductsUseCase,
  GetAllProductsUseCase,
} from '../../application/use-cases/get-all-products.use-case';
import { ProductRepositoryPort } from '../../application/ports/product.repository.port';
import { match } from '../../../../shared/common/rop';

@Controller('api/products')
export class ProductsController {
  private readonly getAllProductsUseCase: GetAllProductsUseCase;

  constructor(
    @Inject(ProductRepositoryPort)
    private readonly productRepository: ProductRepositoryPort,
  ) {
    this.getAllProductsUseCase = createGetAllProductsUseCase(productRepository);
  }

  @Get()
  async findAll() {
    const result = await this.getAllProductsUseCase();

    return match<any, any, any>(
      (products) => ({ success: true, data: products }),
      (error) => {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      },
    )(result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, data: product };
  }
}
