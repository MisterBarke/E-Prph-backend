import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsDate,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
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
    name: 'password',
    description: 'la propriété password de type string',
    default: 'pl90BGDkd76NY',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
