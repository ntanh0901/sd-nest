import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  userId: string;

  @IsArray()
  spu: string[];

  @IsArray()
  sku: string[];

  @IsArray()
  amount: number[];

  @IsOptional()
  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsString()
  status: string;

  @IsString()
  paymentMethod: string;
}
