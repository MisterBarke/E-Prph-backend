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

export class CreateFoldersDto {
  @IsNotEmpty()
  files: FileDto[];

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
  nom: string;

  @ApiProperty({
    type: 'string',
    name: 'adress',
    description: 'la propriété adress de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  adress: string;

  @ApiProperty({
    type: 'string',
    name: 'telephone',
    description: 'la propriété telephone de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  telephone: string;

  @ApiProperty({
    type: 'string',
    name: 'email',
    description: 'la propriété email de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsEmail()
  email: string;
}

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
  isValidate?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRejected?: boolean;
}
