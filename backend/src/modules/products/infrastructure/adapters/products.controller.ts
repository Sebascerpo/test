// Products Controller
import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createGetAllProductsUseCase,
  GetAllProductsUseCase,
} from '../../application/use-cases/get-all-products.use-case';
import { ProductRepositoryPort } from '../../application/ports/product.repository.port';
import { match } from '../../../../shared/common/rop';

@Controller('api/products')
@ApiTags('products')
export class ProductsController {
  private readonly getAllProductsUseCase: GetAllProductsUseCase;

  constructor(
    @Inject(ProductRepositoryPort)
    private readonly productRepository: ProductRepositoryPort,
  ) {
    this.getAllProductsUseCase = createGetAllProductsUseCase(productRepository);
  }

  @Get()
  @ApiOperation({ summary: 'List products with current stock' })
  async findAll() {
    const result = await this.getAllProductsUseCase();

    return match<any, any, any>(
      (products) => ({ success: true, data: products }),
      (error) => {
        throw new HttpException(
          {
            success: false,
            code: 'PRODUCTS_FETCH_FAILED',
            message: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      },
    )(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  async findOne(@Param('id') id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new HttpException(
        {
          success: false,
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return { success: true, data: product };
  }
}
