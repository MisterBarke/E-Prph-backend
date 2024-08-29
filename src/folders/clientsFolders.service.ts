import {
  HttpException,
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
    const connectedClient = await this.prisma.clientUser.findUnique({
      where: {
        id: userId,
      },
    });
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
      include:{
        departement:true
      }
    });
    if (connectedUser.departement.isServiceCourier) {
      return await this.prisma.clientsFolders.findMany({
        skip: decalage,
        take: limit,
        include: {
          createdByClient: true,
          documents: true,
          viewers: true
        },
      });
    }
    return await this.prisma.clientsFolders.findMany({
      skip: decalage,
      take: limit,
      where: {
        //createdByClientId: connectedUser.id,
        OR:[
          {
            createdByClientId: connectedClient.id
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

  async addViwer(id: string, dto: AddViewersDto) {
    if (!dto?.viewers || !dto?.viewers?.length) return;

    const users = await this.prisma.users.findMany({
      where: {
        id: {
          in: dto.viewers,
        },
      },
    });

    if (users.length !== dto.viewers.length) {
      const existingIds = users.map((user) => user.id);
      const nonExistingIds = dto.viewers.filter(
        (id) => !existingIds.includes(id),
      );
      throw new HttpException(
        `Id ${nonExistingIds.join(' ||| ')} incorrects`,
        400,
      );
    }
 
    const addViwers = await Promise.all(
      dto.viewers.map(async (userId) => {
        let viewer = await this.prisma.folderViewer.findFirst({
          where: { userId, folderId: id },
        });

        if (!viewer) {
          viewer = await this.prisma.shareFolderTo.create({
            data: {
              userId,
              folderId: id,
            },
          });
        }

        return viewer;
      }),
    );

    try {
      await this.prisma.clientsFolders.update({
        where: { id },
        data: {
          viewers: {
            connect: addViwers.map((user) => ({ id: user.id })),
          },
        },
      });

      const folder = await this.prisma.clientsFolders.findUnique({
        where: {
          id,
        },
      });

      await this.mailService.sendNoticationForSignature({
        email: users[0].email,
        subject: 'Courier',
        title: 'Nouveau Courier',
        companyName: 'BAGRI Niger',
        companyContry: 'Niger',
        template: 'notification',
        context: {
          username: users[0].name,
          folderName: folder.title,
          folderNumber: '',
        },
      });

      return 'Dossier partagé';
    } catch (error) {
      console.error(error);
      if (error.code === 'P2018') {
        throw new HttpException(
          'Failed to update folder: connected records not found',
          500,
        );
      } else {
        throw new HttpException('Failed to update folder', 500);
      }
    }
  }
}