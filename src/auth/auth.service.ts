import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/create-auth.dto';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private supabaseClient: SupabaseClient,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.supabaseClient = createClient(
      this.configService.get<string>('supabase.url'),
      this.configService.get<string>('supabase.key'),
    );
  }
  async login({ email, password }: LoginDto) {
    return this.supabaseClient.auth
      .signInWithPassword({
        email,
        password,
      })
      .then((value) => {
        const { session, user, weakPassword } = value.data;
        console.log(session, user, weakPassword);
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
        const { session, user } = value.data;
        console.log(session, user);
        const { created_at, email, id, phone, role, user_metadata } = user;

        const newUser = await this.prisma.users.create({
          data: {
            email,
            supabase_id: id,
            phone,
            role,
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
