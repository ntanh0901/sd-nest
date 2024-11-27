import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, mongo } from 'mongoose';

export type SkuDocument = Sku & Document;

@Schema()
export class Sku {
  @Prop({ required: true })
  spu: string;

  @Prop({ required: false })
  sku: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, type: Object })
  attributes: { [key: string]: string };

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: false, default: 0 })
  imageUrls: string[];
}

export const SkuSchema = SchemaFactory.createForClass(Sku);
