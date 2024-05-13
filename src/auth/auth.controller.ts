import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  sign(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN', 'ADMIN_MEMBER')
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('password/update')
  @ApiBearerAuth()
  updatePassword(@Body() data: updatePasswordDto, @Req() request) {
    return this.authService.updatePassword(request.user.id, data);
  }

  @Post('refresh')
  @ApiBearerAuth()
  refreshToken(@Body() data: RefreshTokenDto) {
    return this.authService.retreiveNewSession(data);
  }
}
