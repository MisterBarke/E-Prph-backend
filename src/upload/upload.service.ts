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
    // this.supabaseClient = createClient(
    //   this.configService.get<string>('supabase.url'),
    //   this.configService.get<string>('supabase.key'),
    //   {
    //     auth: {
    //       persistSession: false,
    //     },
    //   },
    // );
  }
  async getFiles(userId: string) {
    const connectedUser = await this.prisma.users.findFirst({
      where: {
        id: userId,
      },
      include: {
        departement: true,
      },
    });
    const folder = await this.prisma.folders.findFirst({
      where: {
        departement: {
          id: connectedUser.departement?.id,
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
    userId?: string,
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
            id: userId,
          },
          data: {
            userSignatureUrl: url,
          },
        });
      } else {
        //set file to default folder
        const connectedUser: any = await this.prisma.users.findFirst({
          where: {
            id: userId,
          },
          include: {
            departement: true,
          },
        });
        if (!connectedUser.departement?.id) {
          let defaultDepartement = await this.prisma.departement.findFirst({
          });
          if (!defaultDepartement) {
            defaultDepartement = await this.prisma.departement.create({
              data: {
                title: '',
              },
            });
          }
          await this.prisma.users.update({
            where: {
              id: connectedUser.id,
            },
            data: {
              departement: {
                connect: {
                  id: defaultDepartement.id,
                },
              },
            },
          });
          connectedUser['departement'] = [defaultDepartement];
        }
        let defaultFolder = await this.prisma.folders.findFirst({
          where: {
            departementId: connectedUser?.departement?.id,
          },
        });
        if (!defaultFolder) {
          defaultFolder = await this.prisma.folders.create({
            data: {
              description: '',
              title: '',
              adress: '',
              departement: {
                connect: {
                  id: connectedUser?.departement?.id,
                },
              },
              email: '',
              telephone: '',
              nom: '',
              createdBy: {
                connect: {
                  id: connectedUser?.id,
                },
              },
            },
          });
        }

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
