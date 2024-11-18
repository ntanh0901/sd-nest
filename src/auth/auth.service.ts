import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { USER_ROLES } from 'constants/index';
import { LogInDto } from './dto/log-in.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './schemas/refresh-token.schema';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { MailSenderService } from 'src/services/mail-sender.service';
import { ResetToken } from './schemas/reset-token.schema';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    @InjectModel(ResetToken.name)
    private readonly resetTokenModel: Model<ResetToken>,
    private jwtService: JwtService,
    private mailSenderService: MailSenderService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    let existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('This email is already exists');
    }

    existingUser = await this.findOneByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('This username is already exists');
    }

    const saltOfBounds = 10;

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltOfBounds,
    );

    let newUser = new this.userModel({
      email: createUserDto.email,
      password: hashedPassword,
      username: createUserDto.username,
      role: USER_ROLES.USER,
    });

    await newUser.save();

    return {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    };
  }

  async login(credentials: LogInDto) {
    const { username, password, twoFactorAuthCode } = credentials;

    let user = await this.findOneByEmail(username);
    if (!user) {
      user = await this.findOneByUsername(username);
    }
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isTwoFactorAuthEnabled = user.twoFactorAuth;
    if (isTwoFactorAuthEnabled) {
      if (!twoFactorAuthCode) {
        throw new UnauthorizedException('Two-factor authentication required');
      }
      const verified = authenticator.verify({
        token: twoFactorAuthCode,
        secret: user.twoFactorAuthSecret,
      });
      if (!verified) {
        throw new UnauthorizedException(
          'Invalid two-factor authentication code',
        );
      }
    }

    return {
      message: 'Login successful',
      token: await this.generateToken(user._id),
    };
  }

  async logout(userId: string, refreshToken: string) {
    try {
      await this.refreshTokenModel.deleteOne({ token: refreshToken });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return {
      message: 'Logout successful',
    };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatched = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.findOneByEmail(email);

    if (user) {
      const resetToken = nanoid(32);
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);
      await this.resetTokenModel.create({
        token: resetToken,
        userId: user._id,
        expires: expires,
      });
      this.mailSenderService.sendPasswordResetEmail(email, resetToken);
    }

    return {
      message: 'If the email exists, a password reset link will be sent',
    };
  }

  async resetPassword(newPassword: string, resetToken: string) {
    const token = await this.resetTokenModel.findOneAndDelete({
      token: resetToken,
      expires: { $gt: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.userModel.findById(token.userId);
    if (!user) {
      throw new InternalServerErrorException();
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return {
      message: 'Password reset successful',
    };
  }

  async findOneByEmail(email: string): Promise<UserDocument> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findOneByUsername(username: string): Promise<UserDocument> {
    return await this.userModel.findOne({ username }).exec();
  }

  async generateToken(userId) {
    const payload = { userId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = uuidv4();
    await this.storeRefreshToken(userId, refreshToken);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    const token = await this.refreshTokenModel.findOne({
      token: refreshToken,
      expires: { $gt: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateToken(token.userId);
  }

  async storeRefreshToken(userId, refreshToken: string) {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await this.refreshTokenModel.updateOne(
      { userId },
      { $set: { expires, token: refreshToken } },
      { upsert: true },
    );
  }

  async generateTwoFactorAuthSecret(userId: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(userId, 'SD Auth', secret);

    const image = await toDataURL(otpauthUrl);

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { twoFactorAuthSecret: secret } },
    );

    return {
      image,
    };
  }

  async enableTwoFactorAuth(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { twoFactorAuth: true } },
    );
    return {
      message: 'Two-factor authentication enabled',
    };
  }

  async verifyTwoFactorAuthCode(userId: string, token: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return authenticator.verify({ token, secret: user.twoFactorAuthSecret });
  }
}
