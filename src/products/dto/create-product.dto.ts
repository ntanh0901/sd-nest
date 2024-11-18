import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  spu: string;

  @IsString()
  brand: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  inStock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsObject()
  sku_attributes?: { [key: string]: string[] };
}
