import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

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
  async getFiles(supabaseId: string) {
    const connectedUser = await this.prisma.users.findFirst({
      where: {
        supabase_id: supabaseId,
      },
      include: {
        departement: true,
      },
    });
    const folder = await this.prisma.folders.findFirst({
      where: {
        isDefault: true,
        departement: {
          id: connectedUser.departement[0]?.id,
        },
      },
      include: {
        documents: true,
      },
    });

    return folder?.documents;
  }

  async uploadFile(
    file: Express.Multer.File,
    signature = false,
    supabaseId?: string,
  ) {
    const folder = 'dossiers';
    const name = `ph_${Math.ceil(Math.random() * 1000)}ph_${Date.now()}ph_${
      file.originalname
    }`;
    const supabaseResp = await this.supabaseClient.storage
      .from(folder)
      .upload(name, file.buffer);
    if (!supabaseResp.error) {
      const url = this.supabaseClient.storage
        .from(folder)
        .getPublicUrl(supabaseResp.data.path).data.publicUrl;
      if (signature) {
        await this.prisma.users.update({
          where: {
            supabase_id: supabaseId,
          },
          data: {
            userSignatureUrl: url,
          },
        });
      } else {
        //set file to default folder
        const connectedUser = await this.prisma.users.findFirst({
          where: {
            supabase_id: supabaseId,
          },
          include: {
            departement: true,
          },
        });
        const defaultFolder = await this.prisma.folders.findFirst({
          where: {
            isDefault: true,
            departementId: connectedUser?.departement[0]?.id,
          },
        });
        const newDocument = await this.prisma.documents.create({
          data: {
            title: file.originalname,
            url,
            folder: {
              connect: {
                id: defaultFolder.id,
              },
            },
            createdBy: {
              connect: {
                id: connectedUser.id,
              },
            },
          },
        });

        return newDocument;
      }

      return {
        ...supabaseResp.data,
        url,
        originalname: file.originalname,
        mimetype: file.mimetype,
      };
    }

    return supabaseResp.error;
  }
}
