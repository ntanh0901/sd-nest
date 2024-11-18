import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { USER_ROLES } from 'constants/index';
import { Document, mongo } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: false, unique: true })
  username: string;

  @Prop({ required: false, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: USER_ROLES, default: USER_ROLES.USER })
  role: USER_ROLES;

  @Prop({ required: false, default: false })
  twoFactorAuth: boolean;

  @Prop({ required: false })
  twoFactorAuthSecret: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
