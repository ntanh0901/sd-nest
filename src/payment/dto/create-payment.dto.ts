import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  userId: string;

  @IsString()
  spu: string;

  @IsString()
  sku: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  totalPrice: number;

  @IsString()
  status: string;

  @IsString()
  paymentMethod: string;
}
