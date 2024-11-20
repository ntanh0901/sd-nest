import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateSkuDto } from './dto/create-sku.dto';
import { updateSkuDto } from './dto/update-sku.dto';
import { AdminGuard } from 'src/guards/amin.guard';

@UseGuards(AdminGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('create')
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Post('create-sku')
  createSku(@Body() createSkuDto: CreateSkuDto) {
    return this.productsService.createSku(createSkuDto);
  }

  @Get('list')
  listProducts() {
    return this.productsService.findAllProducts();
  }

  @Get('list-skus/:spu')
  listSkus(@Param('spu') spu: string) {
    return this.productsService.findAllSkusOfProduct(spu);
  }

  @Get('search/:name')
  searchProducts(@Param('name') name: string) {
    return this.productsService.searchProductsByName(name);
  }

  @Get('categories')
  listCategories() {
    return this.productsService.findAllCategories();
  }

  @Post('update')
  updateProduct(@Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateProduct(
      updateProductDto.spu,
      updateProductDto,
    );
  }

  @Post('update-sku')
  updateSku(@Body() updateSkuDto: updateSkuDto) {
    return this.productsService.updateSku(updateSkuDto.sku, updateSkuDto);
  }

  @Delete('delete')
  deleteProduct(@Body() body) {
    return this.productsService.deleteProduct(body.spu);
  }

  @Delete('delete-sku')
  deleteSku(@Body() body) {
    return this.productsService.deleteSku(body.sku);
  }
}
