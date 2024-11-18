import { Controller, Get, Req, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Body, Post } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { LogInDto } from './dto/log-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '../guards/auth.guards';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
  @Post('logout')
  async Logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(
      refreshTokenDto.userId,
      refreshTokenDto.refreshToken,
    );
  }

  // Refresh Token
  @Post('refresh-token')
  async RefreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  // Change password
  @UseGuards(AuthGuard)
  @Put('change-password')
  async ChangePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return this.authService.changePassword(
      req.userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  // Forgot Password
  @Post('forgot-password')
  async ForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  // Reset Password
  @Put('reset-password')
  async ResetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken,
    );
  }

  // Two factor authentication
  @UseGuards(AuthGuard)
  @Post('twofa/enable')
  async EnableTwoFactorAuth(@Body() body, @Req() req) {
    const isCodeValid = await this.authService.verifyTwoFactorAuthCode(
      req.userId,
      body.twofaCode,
    );
    if (!isCodeValid) {
      return {
        message: 'Invalid code',
      };
    }
    return await this.authService.enableTwoFactorAuth(req.userId);
  }

  @UseGuards(AuthGuard)
  @Get('twofa/generate')
  async GenerateTwoFactorAuthSecret(@Req() req) {
    return await this.authService.generateTwoFactorAuthSecret(req.userId);
  }
}
