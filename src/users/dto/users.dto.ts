import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsString,
  IsDate,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class CreateUsersDto {
  @ApiProperty({
    type: 'string',
    name: 'email',
    description: 'la propriété email de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: 'string',
    name: 'supabase_id',
    description: 'la propriété supabase_id de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  supabase_id: string;

  @ApiProperty({
    type: 'string',
    name: 'phone',
    description: 'la propriété phone de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    type: 'Role',
    name: 'role',
    description: 'la propriété role de type Role',
    default: '',
  })
  @IsNotEmpty()
  role: Role;
}

export class UpdateUsersDto extends PartialType(CreateUsersDto) {}

export class PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  decalage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => String)
  @IsString()
  dateDebut?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  dateFin?: string;
}