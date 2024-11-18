import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, mongo } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  spu: string;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: false, default: 0 })
  inStock: number;

  @Prop({ required: false })
  categories: string[];

  @Prop({ required: false, type: Object, default: {} })
  sku_attributes: { [key: string]: string[] };
}

export const ProductSchema = SchemaFactory.createForClass(Product);
