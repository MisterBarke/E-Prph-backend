import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  updatePasswordDto,
} from './dto/create-auth.dto';
import { Public } from './decorators/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './decorators/role.decorator';
import { Role } from '@prisma/client';
import { pwrdEmailValidationDTO } from 'src/users/dto/users.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  sign(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiBearerAuth()
  //@Roles('SUDO')
  @Post('register/admin/by_super_admin')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto, Role.ADMIN);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post('register/group_admin/by_admin')
  registeAdminMember(@Body() registerDto: RegisterDto) {
    if (!registerDto.departementName)
      throw new HttpException('veuiller ajouter le nom du departement', 400);
    return this.authService.register(registerDto, Role.ADMIN_MEMBER);
  }

  @ApiBearerAuth()
  @Roles('ADMIN_MEMBER')
  @Post('register')
  registerMember(@Body() registerDto: RegisterDto, @Req() request) {
    return this.authService.register(registerDto, 'MEMBER', request.user.id);
  }

  @Post('password/update')
  @ApiBearerAuth()
  updatePassword(@Body() data: updatePasswordDto, @Req() request) {
    return this.authService.updatePassword(request.user.id, data);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @Public()
  refreshToken(@Body() data: RefreshTokenDto) {
    return this.authService.retreiveNewSession(data);
  }

  @ApiCreatedResponse({ description: 'Mot de passe oublie, verification email' })
  @ApiResponse({
    status: 200,
    description: 'Verification terrminer',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiBody({ type: UpdateUsersDto })
  @ApiOperation({
    operationId: 'user validation du email',
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
  @Post('forgot_password/email')
  forgotPasswordEmailValidation(@Body() dto: pwrdEmailValidationDTO) {
    return this.authService.pwrdEmailValidation(dto);
  }
}
