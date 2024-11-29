import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentDocument } from './payment.schema';
import { ProductsService } from 'src/products/products.service';
import * as querystring from 'qs';
import * as crypto from 'crypto';

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
      createPaymentDto.spu,
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

  async addTransaction(createPaymentDto: CreatePaymentDto) {
    const newPayment = new this.paymentModel({
      ...createPaymentDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newPayment.save();

    await this.productsService.updateStockForPendingOrder(
      createPaymentDto.spu,
      createPaymentDto.sku,
      createPaymentDto.amount,
    );

    return {
      status: 'success',
    };
  }

  async createVNPayUrl(createPaymentDto: CreatePaymentDto, req: Request) {
    console.log(createPaymentDto);
    //get a sample ip address
    const ipAddr = '127.0.0.1';

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL;

    const date = new Date();

    const orderId = date.getTime();
    const createDate = date
      .toISOString()
      .slice(0, 19)
      .replace(/[^0-9]/g, '');

    const bankCode = 'NCB';
    const amount = createPaymentDto.totalPrice;

    const orderInfo = '4MEN' + createPaymentDto.userId;
    const orderType = 'other';
    const locale = 'vn';
    const currCode = 'VND';
    let vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = orderType;
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_BankCode'] = bankCode;

    vnp_Params = this.sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: true });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    //await this.create(createPaymentDto);
    await this.addTransaction(createPaymentDto);
    return {
      url: vnpUrl,
    };
  }

  private sortObject(obj: any) {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  async vnPayCallback(query, response) {
    let vnp_Params = query;

    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.sortObject(vnp_Params);

    let tmnCode = process.env.VNP_TMNCODE;
    let secretKey = process.env.VNP_HASHSECRET;

    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require('crypto');
    let hmac = crypto.createHmac('sha512', secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
      const orderInfo = vnp_Params.vnp_OrderInfo;
      const id = orderInfo.substring(4, orderInfo.length);
      const amount = parseInt(vnp_Params.vnp_Amount) / 100;

      if (vnp_Params['vnp_ResponseCode'] === '00') {
        //Thanh toan thanh cong
        //update order status
        const payment = await this.paymentModel
          .findOne({ userId: id })
          .sort({ createdAt: -1 });

        payment.status = 'paid';

        await payment.save();
        response.redirect(
          'http://localhost:3000/checkout/result?status=success',
        );
      } else {
        //Thanh toan khong thanh cong
        //update order status
        const payment = await this.paymentModel.findOne({ userId: id });

        payment.status = 'failed';

        await payment.save();
        response.redirect('http://localhost:3000/checout/result?status=failed');
      }
      //res.render('success', {code: vnp_Params['vnp_ResponseCode']});
    } else {
      console.log('error VNPay call back');
      //res.render('success', {code: '97'});
    }
  }
}
