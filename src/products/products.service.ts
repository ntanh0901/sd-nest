import { ConflictException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/products.schema';
import { Sku, SkuDocument } from './schemas/sku.schema';
import { CreateSkuDto } from './dto/create-sku.dto';
import { updateSkuDto } from './dto/update-sku.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Sku.name) private readonly skuModel: Model<SkuDocument>,
  ) {}

  async createProduct(createProductDto: CreateProductDto) {
    const existingProduct = await this.productModel.findOne({
      spu: createProductDto.spu,
    });

    if (existingProduct) {
      throw new ConflictException('This spu is already exists');
    }

    const newProduct = new this.productModel({
      ...createProductDto,
    });

    await newProduct.save();

    return {
      message: 'Product created successfully',
      data: newProduct,
    };
  }

  async createSku(createSkuDto: CreateSkuDto) {
    if (createSkuDto.sku) {
      const existingSku = await this.skuModel.findOne({
        sku: createSkuDto.sku,
      });

      if (existingSku) {
        throw new ConflictException('This sku is already exists');
      }
    } else {
      createSkuDto.sku = this.generateFormattedSku(createSkuDto);
    }

    //check if sku has all attributes of the product
    const existingProduct = await this.productModel.findOne({
      spu: createSkuDto.spu,
    });

    if (!existingProduct) {
      throw new ConflictException('This spu is not exists');
    }

    for (const key in existingProduct.sku_attributes) {
      if (!createSkuDto.attributes[key]) {
        throw new ConflictException(
          'This sku does not have all attributes of the spu',
        );
      }
    }

    const newSku = new this.skuModel({
      ...createSkuDto,
    });

    await newSku.save();

    await this.updateStockForProduct(createSkuDto.spu, createSkuDto.quantity);

    return {
      message: 'Sku created successfully',
      data: newSku,
    };
  }

  async updateStockForProduct(spu: string, quantity: number) {
    const existingProduct = await this.productModel.findOne({ spu });

    if (!existingProduct) {
      throw new ConflictException('This product is not exists');
    }

    existingProduct.inStock += quantity;

    await existingProduct.save();
  }

  generateFormattedSku(createSkuDto: CreateSkuDto) {
    let sku = createSkuDto.spu;
    for (const key in createSkuDto.attributes) {
      sku += '-';
      sku += createSkuDto.attributes[key];
    }
    return sku;
  }

  async findAllProducts() {
    const products = await this.productModel.find().exec();
    return products;
  }

  async findAllSkusOfProduct(spu: string) {
    const skus = await this.skuModel.find({ spu }).exec();
    return skus;
  }

  async searchProductsByName(name: string) {
    const products = await this.productModel
      .find({ name: { $regex: name, $options: 'i' } })
      .exec();
    return products;
  }

  async findAllCategories() {
    const categories = await this.productModel.distinct('categories').exec();
    return categories;
  }

  async updateProduct(spu: string, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.productModel.findOne({ spu });

    if (!existingProduct) {
      throw new ConflictException('This product is not exists');
    }

    for (const key in updateProductDto) {
      if (updateProductDto[key]) {
        existingProduct[key] = updateProductDto[key];
      }
    }

    await existingProduct.save();

    return {
      message: 'Product updated successfully',
      data: existingProduct,
    };
  }

  async updateSku(sku: string, updateSkuDto: updateSkuDto) {
    const existingSku = await this.skuModel.findOne({ sku });

    if (!existingSku) {
      throw new ConflictException('This sku is not exists');
    }

    for (const key in updateSkuDto) {
      if (updateSkuDto[key]) {
        existingSku[key] = updateSkuDto[key];
        if (key === 'quantity') {
          await this.updateStockForProduct(
            existingSku.spu,
            updateSkuDto[key] - existingSku.quantity,
          );
        }
      }
    }

    await existingSku.save();

    return {
      message: 'Sku updated successfully',
      data: existingSku,
    };
  }

  async deleteProduct(spu: string) {
    const existingProduct = await this.productModel.findOneAndDelete({ spu });

    if (!existingProduct) {
      throw new ConflictException('This product is not exists');
    }

    return {
      message: 'Product deleted successfully',
    };
  }

  async deleteSku(sku: string) {
    const existingSku = await this.skuModel.findOneAndDelete({ sku });

    if (!existingSku) {
      throw new ConflictException('This sku is not exists');
    }

    await this.updateStockForProduct(existingSku.spu, -existingSku.quantity);
    return {
      message: 'Sku deleted successfully',
    };
  }

  async updateStockForPendingOrder(sku: string, quantity: number) {
    const existingSku = await this.skuModel.findOne({ sku });

    if (!existingSku) {
      throw new ConflictException('This sku is not exists');
    }

    existingSku.quantity -= quantity;

    await existingSku.save();

    await this.updateStockForProduct(existingSku.spu, -quantity);
  }
}
