import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  supabaseClient: SupabaseClient;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
   this.s3Client = new S3Client({
      region: this.configService.get<string>('aws-region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws-access-key-id'),
        secretAccessKey: this.configService.get<string>('aws-access-key'),
      },
    });
    this.bucketName = this.configService.get<string>('aws-s3-bucket');
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
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const result = await this.s3Client.send(new PutObjectCommand(uploadParams));

      const fileUrl = `https://${this.bucketName}.s3.${this.configService.get<string>(
        'aws-region',
      )}.amazonaws.com/${fileName}`;

      if (signature) {
        await this.prisma.users.update({
          where: { id: userId },
          data: { userSignatureUrl: fileUrl },
        });
      } else {
        const connectedUser = await this.prisma.users.findFirst({ where: { id: userId } });
        const newDocument = await this.prisma.documents.create({
          data: {
            title: file.originalname,
            url: fileUrl,
            createdBy: { connect: { id: connectedUser.id } },
          },
        });
        return newDocument;
      }

      return {
        url: fileUrl,
        originalname: file.originalname,
        mimetype: file.mimetype,
      };
    } catch (error) {
      console.error(error);
      throw new Error('Failed to upload file to S3');
    }
  }

/* 
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
          let defaultDepartement = await this.prisma.departement.findFirst({});
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
        const newDocument = await this.prisma.documents.create({
          data: {
            title: file.originalname,
            url,
            // ...rest,
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
  } */



  async uploadClientFile(file: Express.Multer.File, userId?: string) {
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

      // Recherche du ClientUser
      const clientUser = await this.prisma.clientUser.findFirst({
        where: { id: userId },
      });

      if (clientUser) {
        // Vérification de l'existence d'un dossier associé
        let defaultClientFolder = await this.prisma.clientsFolders.findFirst({
          where: { createdByClientId: clientUser.id },
        });

        if (!defaultClientFolder) {
          // Création d'un nouveau dossier client s'il n'existe pas
          defaultClientFolder = await this.prisma.clientsFolders.create({
            data: {
              title: '',
              description: '',
              createdByClient: { connect: { id: clientUser.id } },
            },
          });
        }

        // Création d'un document associé au dossier
        const newClientDocument = await this.prisma.clientsDocuments.create({
          data: {
            title: file.originalname,
            url,
            clientsFolders: { connect: { id: defaultClientFolder.id } },
            createdByClient: { connect: { id: clientUser.id } },
          },
        });

        return newClientDocument;
      }

      return { error: 'ClientUser not found.' };
    }

    return supabaseResp.error;
  }
}
