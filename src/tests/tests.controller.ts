import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  Put,
  Req,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TestsService } from './tests.service';
import {
  CreateTestsDto,
  UpdateTestsDto,
  PaginationParams,
} from './dto/tests.dto';
import { Tests } from '@prisma/client';

@ApiTags('tests')
@Controller('tests')
export class TestsController {
  constructor(private testsService: TestsService) {}

  @ApiCreatedResponse({ description: 'Créer un nouveau Tests' })
  @ApiResponse({
    status: 201,
    description: 'Tests est crée',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: CreateTestsDto })
  @ApiOperation({
    operationId: 'CreateTests',
    requestBody: {
      content: {
        'multipart/form-data': {
          encoding: {
            about: {
              contentType: 'application/json',
            },
          },
          schema: {
            type: 'object',
            properties: {
              about: { type: 'array', items: { type: 'number' } },
            },
          },
        },
      },
    },
  })
  @Post('')
  create(@Body() dto: CreateTestsDto): Promise<Tests> {
    return this.testsService.create(dto);
  }

  @ApiCreatedResponse({ description: 'Tous les Tests' })
  @ApiResponse({
    status: 200,
    description: 'Les Tests sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllTests',
  })
  @Get('')
  findAll(
    //@Query('search') search: string,
    @Query() { decalage = 0, limit = 20, dateDebut, dateFin }: PaginationParams,
  ): Promise<Tests[]> {
    return this.testsService.findAll({ decalage, limit, dateDebut, dateFin });
  }

  @ApiCreatedResponse({ description: 'Chercher un Tests' })
  @ApiResponse({
    status: 200,
    description: 'Le Tests est trouvé',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found, le id est introuvable' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetOneTests',
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Tests | null> {
    return this.testsService.findOne(id);
  }

  @ApiCreatedResponse({ description: 'Modification de Tests' })
  @ApiResponse({
    status: 200,
    description: 'Tests est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: UpdateTestsDto })
  @ApiOperation({
    operationId: 'UpdateTests',
    requestBody: {
      content: {
        'multipart/form-data': {
          encoding: {
            about: {
              contentType: 'application/json',
            },
          },
          schema: {
            type: 'object',
            properties: {
              about: { type: 'array', items: { type: 'number' } },
            },
          },
        },
      },
    },
  })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestsDto): Promise<Tests> {
    return this.testsService.update(id, dto);
  }

  @ApiCreatedResponse({ description: 'Supprimer Tests' })
  @ApiResponse({
    status: 200,
    description: 'Le Tests est suprimé',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found, le id est introuvable' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'SoftDeleteTests',
  })
  @Delete(':id')
  delete(@Param('id') id: string): Promise<Tests> {
    return this.testsService.delete(id);
  }
}
