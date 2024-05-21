import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { SupabaseAuthStrategy } from 'nestjs-supabase-auth';
import { SupabaseClient } from '@supabase/supabase-js';
import { Strategy } from 'passport-http-bearer';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  public constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
  ) {
    super();
  }

  async validate(token: string): Promise<any> {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException();
    }
    return data.user;
  }
}
