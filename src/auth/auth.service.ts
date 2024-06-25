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
  RegisterDto,
  updatePasswordDto,
} from './dto/create-auth.dto';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  supabaseClient: SupabaseClient;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.supabaseClient = createClient(
      this.configService.get<string>('supabase.url'),
      this.configService.get<string>('supabase.key'),
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }



  async retreiveNewSession({ refresh_token }: RefreshTokenDto) {
    return this.supabaseClient.auth
      .refreshSession({
        refresh_token,
      })
      .then((res) => {
        if (res.error?.status) {
          throw new HttpException(res.error.message, res.error.status);
        }
        const { session, user } = res.data;
        return session;
      });
  }
  async updatePassword(id: string, { password }: updatePasswordDto) {
    return this.supabaseClient.auth.admin
      .updateUserById(id, { password })
      .then(async (res) => {
        if (res.error?.status) {
          throw new HttpException(res.error.message, res.error.status);
        }
        const { user } = res.data;
        const dataUsers = await this.prisma.users.update({
          where: {
            supabase_id: id,
          },
          data: {
            isPasswordInit: true,
          },
        });
        return user;
      });
  }

  async login({ email, password }: LoginDto) {
    const informationUser = await this.prisma.users.findUnique({
      where: {
        email,
      },
      include: {
        departement: true,
      },
    });
    return this.supabaseClient.auth
      .signInWithPassword({
        email,
        password,
      })
      .then(async (value) => {
        const { session, user } = value.data;
        if (value.error)
          if (value.error?.message == 'Email not confirmed') {
            await this.supabaseClient.auth.admin.updateUserById(
              informationUser.supabase_id,
              {
                email_confirm: true,
              },
            );
            const response = await this.supabaseClient.auth.signInWithPassword({
              email,
              password,
            });
            return {
              ...response.data.session,
              isPasswordInit: informationUser.isPasswordInit,
              user: informationUser,
            };
          } else throw new UnauthorizedException();
        return {
          ...session,
          isPasswordInit: informationUser.isPasswordInit,
          user: informationUser,
        };
      })
      .catch((err) => {
        throw new UnauthorizedException();
      });
  }
  

  generatePassword() {
    const alphabets = 'AZERTYUIOPMLKJHGFDSQWXCVBN'.split('');
    // TODO: Delete this after dev
    return `123456`;
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
      post,
      signaturePosition,
    }: RegisterDto,
    role: Role = Role.MEMBER,
    supabaseId?: string,
  ) {
    const retreiveUser = await this.prisma.users.findUnique({
      where: {
        email,
      },
    });
  
    
    if (retreiveUser) throw new HttpException('User already exist', 409);

    const password = this.generatePassword();
   
    return this.supabaseClient.auth
      .signUp({
        email,
        password,
      })
      .then(async (value) => {

        if (value.error?.status) {
          throw new HttpException(value.error.message, value.error.status);
        }
        const { session, user } = value.data;
        const { created_at, email, id, phone, user_metadata } = user;
        console.log(user);

   const newUser = await this.prisma.users.create({
    data: {
      email,
      supabase_id: id,
      phone,
      role,
      createdAt: created_at,
    },
  });

  

  if (role == Role.ADMIN_MEMBER) {
    
    const departement = await this.prisma.departement.create({
      data: {
        title: departementName,
        isCreditAgricole: isCreditAgricole ?? false,
        isServiceReseau: isServiceReseau ?? false,
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
        supabase_id: supabaseId!,
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
        signaturePosition: signaturePosition ?? 0,
        post,
        departement: {
          connect: {
            id: connectedUser.departement.id,
          },
        },
      },
    });

    return { user: updatedUser, departement: connectedUser.departement };
  }
  return newUser;
        

        // this.mailService.sendMail({
        //   companyContry: 'Niger',
        //   companyName: 'BAGRI',
        //   email,
        //   subject: 'Informations de connexions',
        //   template: 'credential',
        //   title:
        //     'Bienvenue au Parapheur de BAGRI, Veuiller se connecter avec le mot de passe',
        //   context: {
        //     username: email.split('@')[0].split('.').join(' '),
        //     companyName: 'BAGRI',
        //     password,
        //   },
        // });

        //Create departement when create a departement admin member
      
      });
  }
}
