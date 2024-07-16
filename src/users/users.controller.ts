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
import { UsersService } from './users.service';
import {
  CreateUsersDto,
  UpdateUsersDto,
  PaginationParams,
} from './dto/users.dto';
import { Roles } from '../auth/decorators/role.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiCreatedResponse({ description: 'Tous les Users' })
  @ApiResponse({
    status: 200,
    description: 'Les Users sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllUsers',
  })
  @Get('')
  findAll(
    //@Query('search') search: string,
    @Query() { decalage = 0, limit = 200, dateDebut, dateFin }: PaginationParams,
  ) {
    return this.usersService.findAll({ decalage, limit, dateDebut, dateFin });
  }

  @ApiCreatedResponse({ description: 'Tous les Users' })
  @ApiResponse({
    status: 200,
    description: 'Les Users sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllUsersSignateurs',
  })
  @Get('signateurs')
  findAllSignateur(
    //@Query('search') search: string,
    @Query()
    {
      decalage = 0,
      limit = 200,
      dateDebut,
      dateFin,
      isSignateurDossierAgricole,
    }: PaginationParams,
  ) {
    return this.usersService.findAllSignateur({ isSignateurDossierAgricole });
  }

  @ApiCreatedResponse({ description: 'Tous les Users' })
  @ApiResponse({
    status: 200,
    description: 'Les Users sont retrouvés',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetAllUsersDepartementMember',
  })
  @Get('members')
  findAllMember(
    //@Query('search') search: string,
    @Query() { decalage = 0, limit = 200, dateDebut, dateFin }: PaginationParams,
    @Req() request,
  ) {
    return this.usersService.findAllDepartementMember(request.user.id);
  }

  @ApiCreatedResponse({ description: 'Chercher un Users' })
  @ApiResponse({
    status: 200,
    description: 'Le Users est trouvé',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found, le id est introuvable' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'GetOneUsers',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiCreatedResponse({ description: 'Modification de Users' })
  @ApiResponse({
    status: 200,
    description: 'Users est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: UpdateUsersDto })
  @ApiOperation({
    operationId: 'UpdateUsers',
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
  update(@Param('id') id: string, @Body() dto: UpdateUsersDto, @Req() request) {
    const user = request.user;
    return this.usersService.update(id, dto);
  }

  @ApiCreatedResponse({ description: 'Modification de Users' })
  @ApiResponse({
    status: 200,
    description: 'Users est modifié',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: UpdateUsersDto })
  @ApiOperation({
    operationId: 'changeUserRole',
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
  @Roles('ADMIN')
  @Put(':id/roles')
  changeRole(
    @Param('id') id: string,
    @Body() dto: UpdateUsersDto,
    @Req() request,
  ) {
    const user = request.user;
    console.log('user', user);
    return this.usersService.changeRole(id, dto);
  }

  @ApiCreatedResponse({ description: 'Supprimer Users' })
  @ApiResponse({
    status: 200,
    description: 'Le Users est suprimé',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found, le id est introuvable' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiOperation({
    operationId: 'SoftDeleteUsers',
  })
  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
