import {
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddViewersDto, CreateClientsFoldersDto, PaginationParams, UpdateClientsFoldersDto } from './dto/folders.dto';

@Injectable()
export class ClientsFoldersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateClientsFoldersDto, userId: string) {
    const connectedUser = await this.prisma.clientUser.findUnique({
      where: {
        id: userId,
      },
    });

    const newData = await this.prisma.clientsFolders
    .create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        createdByClient: {
          connect: {
            id: connectedUser.id,
          },
        },
      },
    });


    //Update files names
    for (let i = 0; i < dto.files.length; i++) {
      const element = dto.files[i];
      await this.prisma.clientsDocuments.update({
        where: {
          id: element.id,
        },
        data: {
          title: element.title,
          clientsFolders: {
            connect: {
              id: newData.id,
            },
          },
        },
      });
    }
    return newData;
  }

  async findAll(
    {
      limit,
      decalage
    }: PaginationParams,
    userId: string,
  ) {
    const connectedUser = await this.prisma.clientUser.findUnique({
      where: {
        id: userId,
      },
    });
    return await this.prisma.clientsFolders.findMany({
      skip: decalage,
      take: limit,
      where: {
        OR:[
          {
            createdByClient:{
              id: connectedUser.id
            }
          },
          {
            viewers: {
              some: {
                id: connectedUser.id,
              },
            },
          }
        ]
      },
      include: {
        createdByClient: true,
        documents: true
      },
    });
  }

  async addViewersToFolder(folderId: string, addViewersDto: AddViewersDto) {
    const { viewers } = addViewersDto;
    const existingUsers = await this.prisma.users.findMany({
      where: {
        id: { in: viewers },
      },
    });

    const existingUserIds = existingUsers.map(user => user.id);

   await this.prisma.clientsFolders.update({
      where: { id: folderId },
      data: {
        viewers: {
          connect: existingUserIds.map(id => ({ id })),
        },
      },
    });

    return { message: 'Viewers added successfully' };
  }

  async findOne(id: string) {
    return await this.prisma.clientsFolders.findUnique({
      where: { id },
      include: {
        createdByClient: true,
        documents: true
      },
    });
  }

  async delete(id: string) {
    // Supprimer les documents associés au dossier
    await this.prisma.clientsDocuments.deleteMany({
      where: { folderId: id },
    });

    // Supprimer le dossier
    const deletedFolder = await this.prisma.clientsFolders.delete({
      where: { id },
    });
    return deletedFolder;
  }

  async update(id:string, dto: UpdateClientsFoldersDto) {
    const data = await this.findOne(id);
    if (!data) throw new NotFoundException("L'identifiant id n'existe pas");
    return await this.prisma.clientsFolders.update({
      where: { id },
      data: {
        title: dto.title ?? data.title,
        description: dto.description ?? data.description,
      },
    });
  }
}