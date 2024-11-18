import { IsString, IsNumber, IsDate } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  userId: string;

  @IsString()
  spu: string;

  @IsString()
  sku: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  totalPrice: number;

  @IsString()
  status: string;

  @IsString()
  paymentMethod: string;
}
