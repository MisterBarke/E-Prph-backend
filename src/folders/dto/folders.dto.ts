import { ApiProperty } from '@nestjs/swagger';
import { Documents } from '@prisma/client';
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
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

class FileDto {
  @ApiProperty({
    type: 'string',
    name: 'id',
    description: 'la propriété id de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    type: 'string',
    name: 'title',
    description: 'la propriété title de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class AssignSignateurDto {
  @IsNotEmpty()
  signateurs: string[];
}

export class AddViewersDto {
  @IsNotEmpty()
  viewers: string[];
}

export class FolderValidationDto {
  @ApiProperty({
    type: 'boolean',
    name: 'isValidate',
    description: 'la propriété isValidate de type string',
    default: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isValidate: boolean;
}

export class FolderSignatureDto {
  @ApiProperty({
    type: 'string',
    name: 'description',
    description: 'la propriété description de type bool',
    default: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateFoldersDto {
  @IsNotEmpty()
  files: FileDto[];

  @IsOptional()
  signateurs: string[];

  @ApiProperty({
    type: 'string',
    name: 'title',
    description: 'la propriété title de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: 'string',
    name: 'description',
    description: 'la propriété description de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    type: 'string',
    name: 'nom',
    description: 'la propriété nom de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsOptional()
  nom: string;

  @ApiProperty({
    type: 'string',
    name: 'adress',
    description: 'la propriété adress de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsOptional()
  adress: string;

  @ApiProperty({
    type: 'string',
    name: 'telephone',
    description: 'la propriété telephone de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsOptional()
  telephone: string;

  @ApiProperty({
    type: 'string',
    name: 'email',
    description: 'la propriété email de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsEmail()
  @IsOptional()
  email: string;
}

export class CreateClientsFoldersDto {
  @IsNotEmpty()
  files: ClientFileDto[];

  @ApiProperty({
    type: 'string',
    name: 'title',
    description: 'la propriété title de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: 'string',
    name: 'description',
    description: 'la propriété description de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsOptional()
  description: string;
}

class ClientFileDto {
  @ApiProperty({
    type: 'string',
    name: 'id',
    description: 'la propriété id de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    type: 'string',
    name: 'title',
    description: 'la propriété title de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class UpdateClientsFoldersDto extends PartialType(CreateClientsFoldersDto) {}
export class UpdateFoldersDto extends PartialType(CreateFoldersDto) {}

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

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSigningEnded?: boolean;
}

export class FolderVisibilityByAccountantDto {
  @ApiProperty({
    type: 'boolean',
    name: 'isVisible',
    description: 'la propriété isVisible de type bool',
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isVisible: boolean;
}