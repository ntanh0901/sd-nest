import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema()
export class Payment {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  spu: string[];

  @Prop({ required: true })
  sku: string[];

  @Prop({ required: true })
  amount: number[];

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ required: true, type: Object })
  userInfo: Record<string, any>;

  @Prop({ required: true, default: new Date() })
  createdAt: Date;

  @Prop({ required: true, default: new Date() })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
