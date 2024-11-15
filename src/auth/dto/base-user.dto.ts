import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { USER_ROLES } from 'constants/index';

export class BaseUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
