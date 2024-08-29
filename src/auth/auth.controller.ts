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
  RegisterClientDto,
  RegisterDto,
  updatePasswordDto,
} from './dto/create-auth.dto';
import { Public } from './decorators/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './decorators/role.decorator';
import { Role } from '@prisma/client';
import { pwrdEmailValidationDTO } from 'src/users/dto/users.dto';
import { ClientAuthService } from './clientAuth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly clientAuth: ClientAuthService) {}

  @Public()
  @Post('login')
  sign(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('login/client')
  signClient(@Body() loginDto: LoginDto) {
    return this.clientAuth.clientLogin(loginDto);
  }

  @ApiBearerAuth()
  @Roles('SUDO')
  @Post('register/admin/by_super_admin')
  register(@Body() registerDto: RegisterDto,  @Req() request) {
    return this.authService.register(registerDto, Role.ADMIN, request.headers['x-forwarded-for'] || request.connection.remoteAddress);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post('register/group_admin/by_admin')
  registeAdminMember(@Body() registerDto: RegisterDto, @Req() request) {
    if (!registerDto.departementName)
      throw new HttpException('veuiller ajouter le nom du departement', 400);
    return this.authService.register(registerDto, Role.ADMIN_MEMBER, request.headers['x-forwarded-for'] || request.connection.remoteAddress);
  }

  @ApiBearerAuth()
  @Roles('ADMIN_MEMBER')
  @Post('register')
  registerMember(@Body() registerDto: RegisterDto, @Req() request) {
    return this.authService.register(registerDto, Role.MEMBER, request.headers['x-forwarded-for'] || request.connection.remoteAddress, request.user.id);
  }

  @Public()
  @Post('register/by_client')
  registerClient(@Body() registerClientDto: RegisterClientDto, @Req() request) {
    if (!registerClientDto.phone)
      throw new HttpException('veuiller ajouter votre numero de telephone', 400);
    return this.clientAuth.registerClient(registerClientDto, Role.CLIENT, request.headers['x-forwarded-for'] || request.connection.remoteAddress);
  }

  @Post('password/update')
  @Public()
  updatePassword(@Body() data: updatePasswordDto, @Req() request) {
    return this.authService.updatePassword(request.user.id, data);
  }

  @Post('password/update/by_client')
  @Public()
  updateClientPassword(@Body() data: updatePasswordDto) {
    return this.clientAuth.updatePassword(data);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @Public()
  refreshToken(@Body() data: RefreshTokenDto) {
    return this.authService.retreiveNewSession(data);
  }


  @Public()
  @Post('forgot_password/email')
  forgotPasswordEmailValidation(@Body() dto: pwrdEmailValidationDTO) {
    return this.authService.pwrdEmailValidation(dto);
  }
}
