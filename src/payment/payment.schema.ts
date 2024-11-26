import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, mongo } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema()
export class Payment {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  spu: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
