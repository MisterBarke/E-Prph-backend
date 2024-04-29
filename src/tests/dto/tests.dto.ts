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
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class CreateTestsDto {
  @ApiProperty({
    type: 'string',
    name: 'name',
    description: 'la propriété name de type string',
    default: 'lorem ipsum',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateTestsDto extends PartialType(CreateTestsDto) {}

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
