import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto/create-auth.dto';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';

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

  async login({ email, password }: LoginDto) {
    return this.supabaseClient.auth
      .signInWithPassword({
        email,
        password,
      })
      .then(async (value) => {
        const { session, user } = value.data;
        if (value.error)
          if (value.error?.message == 'Email not confirmed') {
            const informationUser = await this.prisma.users.findUnique({
              where: {
                email,
              },
            });
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
            return response.data.session;
          } else throw new UnauthorizedException();
        return session;
      })
      .catch((err) => {
        throw new UnauthorizedException();
      });
  }

  async register({ email, password }: RegisterDto) {
    const retreiveUser = await this.prisma.users.findUnique({
      where: {
        email,
      },
    });
    if (retreiveUser) throw new HttpException('User already exist', 409);

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
        // console.log(user);
        const { created_at, email, id, phone, user_metadata } = user;

        const newUser = await this.prisma.users.create({
          data: {
            email,
            supabase_id: id,
            phone,
            role: '',
            createdAt: created_at,
          },
        });

        return newUser;
      })
      .catch((err) => {
        throw new UnauthorizedException();
      });
  }
}
