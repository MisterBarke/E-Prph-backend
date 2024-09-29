import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
  }
  async getSignedUrl(fileKey: string): Promise<string> {
    const getObjectData = {
      Bucket: this.bucketName,
      Key: fileKey,
    };
    const command = new GetObjectCommand(getObjectData);
    return await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });
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
    const documents = folder.documents;
    for (const doc of documents) {
      if (doc?.url) {
        const signedUrl = await this.getSignedUrl(doc.url);
        doc.url = signedUrl;
      }
    }
    return documents;
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
      const result = await this.s3Client.send(
        new PutObjectCommand(uploadParams),
      );

      const fileUrl = `${fileName}`;
      if (signature) {
        await this.prisma.users.update({
          where: { id: userId },
          data: { userSignatureUrl: fileUrl },
        });
      } else {
        const connectedUser = await this.prisma.users.findFirst({
          where: { id: userId },
        });
        console.log(connectedUser.name);

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
