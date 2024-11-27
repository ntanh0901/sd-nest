import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { PaymentModule } from './payment/payment.module';
import { PassportModule } from '@nestjs/passport';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_TOKEN_SECRET,
    }),
    ProductsModule,
    AuthModule,
    PaymentModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
