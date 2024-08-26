import {
    Injectable,
  } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFoldersDto, PaginationParams } from './dto/folders.dto';

@Injectable()
export class FoldersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateFoldersDto, userId: string) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        departement: true,
      },
    });

    const highestNumber = await this.prisma.folders.findFirst({
      orderBy: {
        number: 'desc',
      },
      select: {
        number: true,
      },
    });

    const newNumber = highestNumber ? highestNumber.number + 1 : 1;

    const newData = await this.prisma.folders.create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        nom: dto.nom ?? '',
        adress: dto.adress ?? '',
        telephone: dto.telephone ?? '',
        email: dto.email ?? '',
        createdBy: {
          connect: {
            id: connectedUser.id,
          },
        },
        departement: {
          connect: {
            id: connectedUser.departement.id,
            title: connectedUser.departement.title,
          },
        },
        number: newNumber,
      },
    });


    //Update files names
    for (let i = 0; i < dto.files.length; i++) {
      const element = dto.files[i];
      await this.prisma.documents.update({
        where: {
          id: element.id,
        },
        data: {
          title: element.title,
          folder: {
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
      decalage,
      dateDebut,
      dateFin,
    }: PaginationParams,
    userId: string,
  ) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        departement: true,
      },
    });
    return await this.prisma.folders.findMany({
      skip: decalage,
      take: limit,
      where: {
        departementId: connectedUser.departement.id,
        signateurs: {
          some: {
            userId: connectedUser.id,
          },
        },
      },
      include: {
        createdBy: true,
        signateurs: true,
        signatures: true,
        departement: true,
        documents: true,
      },
    });
  }
}