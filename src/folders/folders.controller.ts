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
import { FoldersService } from './folders.service';
import {
  CreateFoldersDto,
  UpdateFoldersDto,
  PaginationParams,
  FolderValidationDto,
  AssignSignateurDto,
  FolderSignatureDto,
} from './dto/folders.dto';
import { request } from 'http';

@ApiTags('folders')
@Controller('folders')
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @ApiCreatedResponse({ description: 'Créer un nouveau Folders' })
  @ApiResponse({
    status: 201,
    description: 'Folders est crée',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: CreateFoldersDto })
  @ApiOperation({
    operationId: 'CreateFolders',
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
  create(@Body() dto: CreateFoldersDto, @Req() request) {
    return this.foldersService.create(dto, request.user.id);
  }

  //get all folders
  @ApiCreatedResponse({ description: 'Tous les Folders' })
  @ApiResponse({
    status: 200,
    description: 'Les Folders sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllFolders',
  })
  @Get('')
  findAll(
    //@Query('search') search: string,
    @Query()
    {
      decalage = 0,
      limit = 50,
      dateDebut,
      dateFin,
      isRejected,
      isValidate,
    }: PaginationParams,
    @Req() request,
  ) {
    return this.foldersService.findAll(
      { decalage, limit, dateDebut, dateFin, isRejected, isValidate },
      request.user.id,
    );
  }

  //get by service reseau
  @ApiCreatedResponse({ description: 'Tous les Folders' })
  @ApiResponse({
    status: 200,
    description: 'Les Folders sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllFoldersByserviceReseau',
  })
  @Get('service_reseau')
  findAllServiceReseau(
    //@Query('search') search: string,
    @Query()
    {
      decalage = 0,
      limit = 20,
      dateDebut,
      dateFin,
      isRejected,
      isValidate,
    }: PaginationParams,
  ) {
    return this.foldersService.getFoldersByServiceReseau({
      decalage,
      limit,
      dateDebut,
      dateFin,
      isRejected,
      isValidate,
    });
  }

  //get by signatory

  @ApiCreatedResponse({ description: 'Tous les Folders' })
  @ApiResponse({
    status: 200,
    description: 'Les Folders sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllFoldersSignatory',
  })
  @Get('signateurs')
  findAllSignatory(
    //@Query('search') search: string,
    @Query()
    {
      decalage = 0,
      limit = 20,
      dateDebut,
      dateFin,
      isRejected,
      isValidate,
    }: PaginationParams,
    @Req() request,
  ) {
    return this.foldersService.getFoldersBySignatory({
      decalage,
      limit,
      dateDebut,
      dateFin,
      isRejected,
      isValidate
    }, request.user.id);
  }

  //get one folder
  @ApiCreatedResponse({ description: 'Chercher un Folders' })
  @ApiResponse({
    status: 200,
    description: 'Le Folders est trouvé',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found, le id est introuvable' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetOneFolders',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id);
  }

  // edit folder
  @ApiCreatedResponse({ description: 'Modification de Folders' })
  @ApiResponse({
    status: 200,
    description: 'Folders est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: UpdateFoldersDto })
  @ApiOperation({
    operationId: 'UpdateFolders',
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
  update(@Param('id') id: string, @Body() dto: UpdateFoldersDto) {
    return this.foldersService.update(id, dto);
  }

  @ApiCreatedResponse({ description: 'Modification de Folders' })
  @ApiResponse({
    status: 200,
    description: 'Folders est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: UpdateFoldersDto })
  @ApiOperation({
    operationId: 'UpdateFolders',
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
  @Put(':id/assign_signateurs')
  assignSignateursToFolder(
    @Param('id') id: string,
    @Body() dto: AssignSignateurDto,
  ) {
    return this.foldersService.assignSignateursToFolder(id, dto);
  }

  @ApiCreatedResponse({ description: 'Modification de Folders' })
  @ApiResponse({
    status: 200,
    description: 'Folders est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: FolderValidationDto })
  @ApiOperation({
    operationId: 'UpdateFolders',
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
  @Put(':id/service_reseau')
  updateFolder(
    @Param('id') id: string,
    @Body() dto: FolderValidationDto,
    @Req() request,
  ) {
    return this.foldersService.folderValidationByServiceReseau(
      id,
      dto,
      request.user.id,
    );
  }

  @ApiCreatedResponse({ description: 'Modification de Folders' })
  @ApiResponse({
    status: 200,
    description: 'Folders est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: FolderValidationDto })
  @ApiOperation({
    operationId: 'UpdateFolders',
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
  @Put(':id/sign')
  signFolder(
    @Param('id') id: string,
    @Body() dto: FolderSignatureDto,
    @Req() request,
  ) {
    return this.foldersService.signFolder(request.user.id, id, dto);
  }

  @ApiCreatedResponse({ description: 'Supprimer Folders' })
  @ApiResponse({
    status: 200,
    description: 'Le Folders est suprimé',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found, le id est introuvable' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'SoftDeleteFolders',
  })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.foldersService.delete(id);
  }
}
