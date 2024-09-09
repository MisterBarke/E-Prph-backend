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
  FolderVisibilityByAccountantDto,
  CreateClientsFoldersDto,
  UpdateClientsFoldersDto,
  AddViewersDto,
  ShareToDto,
} from './dto/folders.dto';
import { request } from 'http';
import { ClientsFoldersService } from './clientsFolders.service';

@ApiTags('folders')
@Controller('folders')
export class FoldersController {
  constructor(private foldersService: FoldersService, private clientsFoldersService: ClientsFoldersService) {}
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

  @ApiCreatedResponse({ description: 'Tous les Folders' })
  @ApiResponse({
    status: 200,
    description: 'Les Folders sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllFoldersByAdmin',
  })
  @Get('')
  findAll(
    //@Query('search') search: string,
    @Query()
    {
      decalage = 0,
      limit = 200,
      dateDebut,
      dateFin,
      isSigningEnded
    }: PaginationParams,
    @Req() request,
  ) {
    return this.foldersService.getAllFolders({
      decalage,
      limit,
      dateDebut,
      dateFin,
      isSigningEnded
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
  @Get(':id/get_one')
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
  @ApiBody({ type: AssignSignateurDto })
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
    @Req() request
  ) {
    return this.foldersService.assignSignateursToFolder(id, dto, request.user.id);
  }

  @ApiCreatedResponse({ description: 'Partage d\'un folder' })
  @ApiResponse({
    status: 200,
    description: 'Folder Partagé',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: ShareToDto })
  @ApiOperation({
    operationId: 'shareFolder',
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
  @Put(':id/shareFolder')
  shareFolderToUser(
    @Param('id') id: string,
    @Body() dto: ShareToDto,
  ) {
    return this.foldersService.shareFolder(id, dto);
  }

  @ApiCreatedResponse({ description: 'Tous les couriers' })
  @ApiResponse({
    status: 200,
    description: 'Les couriers sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllCouriers',
  })
  @Get('courier')
  findAllCourier(
    @Query()
    {
      decalage = 0,
      limit = 200,
    }: PaginationParams,
    @Req() request,
  ) {
    return this.foldersService.getAllCourier({
      decalage,
      limit,
    }, request.user.id);
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


  //CLIENT OPERATIONS

  @ApiCreatedResponse({ description: 'Créer un nouveau Folder client' })
  @ApiResponse({
    status: 201,
    description: 'Folder est crée',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: CreateClientsFoldersDto })
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
  @Post('client')
  createClientFolder(@Body() dto: CreateClientsFoldersDto, @Req() request) {
    return this.clientsFoldersService.create(dto, request.user.id);
  }

  @ApiCreatedResponse({ description: 'Tous les Folders des clients' })
  @ApiResponse({
    status: 200,
    description: 'Les Folders sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllClientFolders',
  })
  @Get('client')
  findAllClientsFolders(
    //@Query('search') search: string,
    @Query()
    {
      decalage = 0,
      limit = 100,
      dateDebut,
      dateFin,
    }: PaginationParams,
    @Req() request,
  ) {
    //console.log(request.user);
    
    return this.clientsFoldersService.findAll(
      { decalage, limit, dateDebut, dateFin },
      request.user.id,
    );
  }

  @ApiCreatedResponse({ description: 'Modification de Folders des clients' })
  @ApiResponse({
    status: 200,
    description: 'Folders est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: UpdateClientsFoldersDto })
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
  @Put(':id/client')
  updateClientFolder(@Param('id') id: string, @Body() dto: UpdateClientsFoldersDto) {
    return this.clientsFoldersService.update(id, dto);
  }

  @ApiCreatedResponse({ description: 'Modification de Folders des clients' })
  @ApiResponse({
    status: 200,
    description: 'Folders est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: UpdateClientsFoldersDto })
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
  @Put(':id/viewers')
  async addViewers(@Param('id') folderId: string,
    @Body() addViewersDto: AddViewersDto,
  ) {
    return this.clientsFoldersService.addViewersToFolder(folderId, addViewersDto);
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
  @Delete(':id/client')
  deleteClientFolder(@Param('id') id: string) {
    return this.clientsFoldersService.delete(id);
  }
}
