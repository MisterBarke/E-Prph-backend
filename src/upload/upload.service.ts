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

  async getSingleFile(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!file) throw new HttpException('No file exist on this id', 404);
    return file;
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
        isDefault: true,
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
    const newFile = await this.prisma.file.create({
      data: {
        filename: file.filename,
        mimetype: file.mimetype,
        path: file.path,
      },
    });

    if (signature) {
      await this.prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          userSignatureUrl: newFile.id,
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
          where: {
            isDefault: true,
          },
        });
        if (!defaultDepartement) {
          defaultDepartement = await this.prisma.departement.create({
            data: {
              title: '',
              isDefault: true,
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
          isDefault: true,
          departementId: connectedUser?.departement?.id,
        },
      });
      if (!defaultFolder) {
        defaultFolder = await this.prisma.folders.create({
          data: {
            isDefault: true,
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
          url: newFile.id,
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
      url: newFile.id,
      originalname: file.originalname,
      mimetype: file.mimetype,
    };
  }
}
