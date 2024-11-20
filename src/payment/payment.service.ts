import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentDocument } from './payment.schema';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const newPayment = new this.paymentModel({
      ...createPaymentDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newPayment.save();

    this.productsService.updateStockForPendingOrder(
      createPaymentDto.sku,
      createPaymentDto.amount,
    );

    return {
      message: 'Payment created successfully',
      data: newPayment,
    };
  }

  async findAll() {
    const payments = await this.paymentModel.find().exec();
    return payments;
  }

  async findAllByUser(userId: string) {
    const payments = await this.paymentModel.find({ userId }).exec();
    return payments;
  }

  async revenueByMonth(month: number) {
    const payments = await this.paymentModel
      .find({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), month - 1, 1),
          $lt: new Date(new Date().getFullYear(), month, 1),
        },
      })
      .exec();

    return {
      revenue: payments.reduce((acc, payment) => acc + payment.totalPrice, 0),
      payments,
    };
  }

  async update(paymentId: string, updatePaymentDto: UpdatePaymentDto) {
    const updatedPayment = await this.paymentModel.findOne({ _id: paymentId });

    if (!updatedPayment) {
      throw new NotFoundException('Payment not found');
    }

    for (const key in updatePaymentDto) {
      updatedPayment[key] = updatePaymentDto[key];
    }

    await updatedPayment.save();

    return {
      message: 'Payment updated successfully',
      data: updatedPayment,
    };
  }

  async deletePayment(paymentId: string) {
    const payment = await this.paymentModel.findOneAndDelete({
      _id: paymentId,
    });
    return {
      message: 'Payment deleted successfully',
      data: payment,
    };
  }
}
