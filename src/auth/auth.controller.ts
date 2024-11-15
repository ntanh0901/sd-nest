import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Body, Post } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LogInDto } from './dto/log-in.dto';
import { RefreshToken } from './schemas/refresh-token.schema';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //Signup
  @Post('signup')
  async SignUp(@Body() signUpDto: SignUpDto) {
    const user = await this.authService.signUp(signUpDto);
    return user;
  }

  // Login
  @Post('login')
  async Login(@Body() loginDto: LogInDto) {
    const user = await this.authService.login(loginDto);
    return user;
  }

  // Logout

  // Refresh Token
  @Post('refresh-token')
  async RefreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  // Forgot Password

  // Reset Password

  // Two factor authentication
}
