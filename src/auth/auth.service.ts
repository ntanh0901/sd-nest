import {
  Injectable,
  ConflictException,
  UnauthorizedException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
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
      email: newUser.email,
      role: newUser.role,
    };
  }

  async login(credentials: LogInDto) {
    const { username, password } = credentials;

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

    return {
      message: 'Login successful',
      token: await this.generateToken(user.username),
    };
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findOneByUsername(username: string): Promise<User> {
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
}
