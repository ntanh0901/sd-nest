import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guards';

@UseGuards(AuthGuard)
@Controller()
export class AppController {
  @Get()
  getHello(@Req() req) {
    return { message: 'Hello World', userId: req.userId };
  }
}
