import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Req,
  Query,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/guards/amin.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get('list')
  findAll() {
    return this.paymentService.findAll();
  }

  @Get('list/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.paymentService.findAllByUser(userId);
  }

  @Get('revenue/:month')
  revenueByMonth(@Param('month') month: number) {
    return this.paymentService.revenueByMonth(month);
  }

  @Put('update/:id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete('delete/:id')
  deletePayment(@Param('id') id: string) {
    return this.paymentService.deletePayment(id);
  }

  @Post('vnpay')
  getVNPayUrl(@Body() CreatePaymentDto: CreatePaymentDto, @Req() request) {
    return this.paymentService.createVNPayUrl(CreatePaymentDto, request);
  }

  @Post('transaction')
  createNormalPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.addTransaction(createPaymentDto);
  }

  @Get('vnpay-return')
  vnpayReturn(@Query() request, @Res() response) {
    return this.paymentService.vnPayCallback(request, response);
  }
}
