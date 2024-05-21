import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UploadService {
  supabaseClient: SupabaseClient;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
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
  async uploadFile(file: Express.Multer.File, fileType?: string) {
    const folder = fileType ?? 'dossiers';
    const name = `ph_${Math.ceil(Math.random() * 1000)}ph_${Date.now()}ph_${
      file.originalname
    }`;
    const supabaseResp = await this.supabaseClient.storage
      .from(folder)
      .upload(name, file.buffer);
    if (!supabaseResp.error)
      return {
        ...supabaseResp.data,
        originalname: file.originalname,
        mimetype: file.mimetype,
      };

    return supabaseResp.error;
  }

  async getFile(pathFile: string) {
    return this.supabaseClient.storage
      .from('')
      .download(pathFile)
      .then((res) => {
        if (res.error) {
          throw new HttpException(res.error.message, 401);
        }
        return res.data;
      })
      .catch((err) => {
        throw new HttpException(err?.message, 401);
      });
  }
}
