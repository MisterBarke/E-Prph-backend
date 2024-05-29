import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsDate,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
  IsBoolean,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    type: 'string',
    name: 'email',
    description: 'la propriété email de type string',
    default: 'john@doe.test',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: 'string',
    name: 'password',
    description: 'la propriété password de type string',
    default: 'pl90BGDkd76NY',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    type: 'string',
    name: 'email',
    description: 'la propriété email de type string',
    default: 'john@doe.test',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: 'string',
    name: 'departementName',
    description: 'la propriété departementName de type string',
    default: '',
  })
  @IsString()
  @IsOptional()
  departementName: string;

  @ApiProperty({
    type: 'boolean',
    name: 'isCreditAgricole',
    description: 'la propriété isCreditAgricole de type string',
    default: '',
  })
  @IsBoolean()
  @IsOptional()
  isCreditAgricole: boolean;
}

export class updatePasswordDto {
  @ApiProperty({
    type: 'string',
    name: 'password',
    description: 'la propriété password de type string',
    default: 'pl90BGDkd76NY',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    type: 'string',
    name: 'refresh_token',
    description: 'la propriété refresh_token de type string',
    default: '',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
