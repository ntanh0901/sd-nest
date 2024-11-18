import { IsString, IsOptional } from 'class-validator';

export class LogInDto {
  @IsString()
  username: string;
  @IsString()
  password: string;
  @IsOptional()
  @IsString()
  twoFactorAuthCode?: string;
}
