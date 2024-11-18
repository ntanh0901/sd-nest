import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateSkuDto {
  @IsString()
  spu: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  price: number;

  @IsObject()
  attributes: { [key: string]: string };

  @IsNumber()
  quantity: number;
}