import {
    BadRequestException,
    HttpException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import {
    LoginDto,
    RefreshTokenDto,
    RegisterClientDto,
    RegisterDto,
    updatePasswordDto,
  } from './dto/create-auth.dto';
  import { PrismaService } from '../prisma/prisma.service';
  import { ConfigService } from '@nestjs/config';
  import { MailService } from 'src/mail/mail.service';
  import { Role } from '@prisma/client';
  import * as bcrypt from 'bcrypt';
  import { JwtService } from '@nestjs/jwt';
  import axios from 'axios';
  
  @Injectable()
  export class ClientAuthService {
    constructor(
      private prisma: PrismaService,
      private configService: ConfigService,
      private mailService: MailService,
      private jwtService: JwtService,
    ) {
   
    }
    private async getLocation(ip: string): Promise<string> {
      try {
        const response = await axios.get(`http://ip-api.com/json/${ip}?fields=city,regionName`);
        const { city, regionName } = response.data;
        return `${city}, ${regionName}`;
      } catch (error) {
        console.error('Error fetching location:', error);
        return 'Unknown location';
      }
    }

    async updatePassword({password, userId }: updatePasswordDto) {
        const user = await this.prisma.clientUser.findUnique({
          where: {
            id: userId,
          },
        });
        if (!user) throw new UnauthorizedException();
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(password, saltOrRounds);
        await this.prisma.clientUser.update({
          where: {
            id: userId,
          },
          data: {
            isPasswordInit: true,
            password: hash,
          },
        });
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
  
  
    async validateClient(email: string, password: string) {
      const user = await this.prisma.clientUser.findFirst({
        where: {
          email,
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
      await this.prisma.clientUser.update({
        where: {
          id: userId,
        },
        data: {
          refresh_token: data.refresh_token,
        },
      });
      return { ...data, ...r };
    }
  
    async clientLogin({ email, password }: LoginDto) {
      const informationUser = await this.validateClient(email, password);
      if (!informationUser) throw new UnauthorizedException();
      const tokens = await this.signJwt(informationUser.id, informationUser);
      return {
        ...tokens,
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
  
  
    async registerClient(
      {
        email,
        password,
        phone
      }: RegisterClientDto,
      role: Role = Role.CLIENT,
      location
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
          phone,
          role,
          location,
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
  