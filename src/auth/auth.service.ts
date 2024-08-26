import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterClientDto,
  RegisterDto,
  updatePasswordDto,
} from './dto/create-auth.dto';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  supabaseClient: SupabaseClient;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {
 
  }

  async retreiveNewSession({ refresh_token }: RefreshTokenDto) {
    const data = await this.jwtService.verify(refresh_token);
    const user = await this.prisma.users.findFirst({
      where: {
        refresh_token,
        id: data?.userId,
      },
    });
    if (!user) throw new HttpException('Veuiler se connecter', 401);
    const { password, ...rest } = user;
    const res = await this.signJwt(user.id, rest);
    return res;
  }
  async updatePassword(id: string, { password }: updatePasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: {
        id,
      },
    });
    if (!user) throw new UnauthorizedException();
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);
    await this.prisma.users.update({
      where: {
        id,
      },
      data: {
        isPasswordInit: true,
        password: hash,
      },
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        email,
      },
      include: {
        departement: true,
      },
    });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async signJwt(userId: string, payload) {
    const data = {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign({ userId }, { expiresIn: '1d' }),
    };
    const r = this.jwtService.decode(data.access_token);
    await this.prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        refresh_token: data.refresh_token,
      },
    });
    return { ...data, ...r };
  }

  async login({ email, password }: LoginDto) {
    const informationUser = await this.validateUser(email, password);
    if (!informationUser) throw new UnauthorizedException();
    const tokens = await this.signJwt(informationUser.id, informationUser);
    return {
      ...tokens,
      isPasswordInit: informationUser.isPasswordInit,
      user: informationUser,
    };
  }

  generatePassword() {
    const alphabets = 'AZERTYUIOPMLKJHGFDSQWXCVBN'.split('');
    // TODO: Delete this after dev
    //return `123456`;
    return `${Math.floor(Math.random() * 100000000)}`
      .split('')
      .map((el, i) =>
        i % 3 == 0 ? alphabets[Math.floor(Math.random() * 25)] : el,
      )
      .join('');
  }

  async register(
    {
      email,
      departementName,
      isCreditAgricole,
      isServiceReseau,
      isAccountant,
      position,
      matricule,
      isFromNiamey,
    }: RegisterDto,
    role: Role = Role.MEMBER,
    userId?: string,
  ) {
    const retreiveUser = await this.prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (retreiveUser) throw new HttpException('User already exist', 409);

    const password = this.generatePassword();
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);
    const newUser = await this.prisma.users.create({
      data: {
        email,
        phone: '',
        role,
        password: hash,
      },
    });

    if (role == Role.ADMIN_MEMBER) {
      const departement = await this.prisma.departement.create({
        data: {
          title: departementName,
          isCreditAgricole: isCreditAgricole ?? false,
          isServiceReseau: isServiceReseau ?? false,
          isAccountant: isAccountant ?? false,
          isFromNiamey: isFromNiamey ?? false,
          users: {
            connect: {
              id: newUser.id,
            },
          },
        },
      });

      await this.prisma.users.update({
        where: {
          id: newUser.id,
        },
        data: {
          departement: {
            connect: {
              id: departement.id,
            },
          },
        },
      });
      return { user: newUser, departement };
    }

    if (role == Role.MEMBER) {
      const connectedUser = await this.prisma.users.findUnique({
        where: {
          id: userId,
        },
        include: {
          departement: true,
        },
      });
      const updatedUser = await this.prisma.users.update({
        where: {
          id: newUser.id,
        },
        data: {
          isSignateurDossierAgricole: isCreditAgricole ? true : false,
          position,
          matricule,
          departement: {
            connect: {
              id: connectedUser.departement.id,
            },
          },
        },
      });

      return { user: updatedUser, departement: connectedUser.departement };
    }

    await this.mailService.sendMail({
      companyContry: 'Niger',
      companyName: 'BAGRI',
      email,
      subject: 'Informations de connexions',
      template: 'credential',
      title:
        'Bienvenue au Parapheur de BAGRI, Veuiller Vous connecter avec le mot de passe',
      context: {
        username: email.split('@')[0].split('.').join(' '),
        companyName: 'BAGRI',
        password,
      },
    });

    return newUser;
   
  }

  async registerClient(
    {
      email,
      password
    }: RegisterClientDto,
    role: Role = Role.CLIENT
  ) {
    const retreiveUser = await this.prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (retreiveUser) throw new HttpException('User already exist', 409);

    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);
    const newUser = await this.prisma.clientUser.create({
      data: {
        email,
        phone: '',
        role,
        password: hash,
      },
    });

    await this.mailService.sendMail({
      companyContry: 'Niger',
      companyName: 'BAGRI',
      email,
      subject: 'Informations de connexions',
      template: 'credential',
      title:
        'Bienvenue au Parapheur de BAGRI, Veuiller Vous connecter avec le mot de passe',
      context: {
        username: email.split('@')[0].split('.').join(' '),
        companyName: 'BAGRI',
        password,
      },
    });

    return newUser;
  }
}
