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
    default: 'companysoftart@gmail.com',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: 'string',
    name: 'password',
    description: 'la propriété password de type string',
    default: '',
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
    default: 'companysoftart@gmail.com',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: 'string',
    name: 'location',
    description: 'la propriété location de type string',
    default: 'companysoftart@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

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
    type: 'string',
    name: 'position',
    description: 'la propriété position de type string',
    default: '',
  })
  @IsString()
  @IsOptional()
  position: string;

  @ApiProperty({
    type: 'string',
    name: 'matricule',
    description: 'la propriété matricule de type string',
    default: '',
  })
  @IsString()
  @IsOptional()
  matricule: string;

  @ApiProperty({
    type: 'number',
    name: 'signaturePosition',
    description: 'la propriété signaturePosition de type number',
    default: '',
  })
  @IsNumber()
  @IsOptional()
  signaturePosition: number;

  @ApiProperty({
    type: 'boolean',
    name: 'isCreditAgricole',
    description: 'la propriété isCreditAgricole de type boolean',
    default: '',
  })
  @IsBoolean()
  @IsOptional()
  isCreditAgricole: boolean;

  @ApiProperty({
    type: 'boolean',
    name: 'isServiceReseau',
    description: 'la propriété isServiceReseau de type boolean',
    default: '',
  })
  @IsBoolean()
  @IsOptional()
  isServiceReseau: boolean;

  @ApiProperty({
    type: 'boolean',
    name: 'isAccountant',
    description: 'la propriété isAccountant de type boolean',
    default: '',
  })
  @IsBoolean()
  @IsOptional()
  isAccountant: boolean;

  @ApiProperty({
    type: 'boolean',
    name: 'isFromNiamey',
    description: 'la propriété isFromNiamey de type boolean',
    default: '',
  })
  @IsBoolean()
  @IsOptional()
  isFromNiamey: boolean;
}

export class RegisterClientDto {
  @ApiProperty({
    type: 'string',
    name: 'email',
    description: 'la propriété email de type string',
    default: '',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: 'string',
    name: 'password',
    description: 'la propriété password de type string',
    default: '',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    type: 'string',
    name: 'phone',
    description: 'la propriété phone de type string',
    default: '',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    type: 'string',
    name: 'addresse',
    description: 'la propriété addresse de type string',
    default: '',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  address: string;
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
