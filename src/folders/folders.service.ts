import {
  Injectable,
  NotFoundException,
  Post,
  ConflictException,
} from '@nestjs/common';
import {
  CreateFoldersDto,
  UpdateFoldersDto,
  PaginationParams,
  FolderValidationDto,
} from './dto/folders.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFoldersDto, supabase_id: string) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
      },
      include: {
        departement: true,
      },
    });

    const newData = await this.prisma.folders.create({
      data: {
        title: dto.title,
        description: dto.description,
        nom: dto.nom,
        adress: dto.adress,
        telephone: dto.telephone,
        email: dto.email,
        isValidateBeforeSignature: connectedUser.departement[0].isCreditAgricole
          ? false
          : true,
        createdBy: {
          connect: {
            id: connectedUser.id,
          },
        },
        departement: {
          connect: {
            id: connectedUser.departement[0].id,
          },
        },
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

  async findAll({ limit, decalage, dateDebut, dateFin }: PaginationParams) {
    return await this.prisma.folders.findMany({
      skip: decalage,
      take: limit,
      include: {
        createdBy: true,
        signateurs: true,
        signatures: true,
        departement: true,
      },
    });
  }

  async getFoldersByServiceReseau({
    limit,
    decalage,
    dateDebut,
    dateFin,
    isValidate = false,
    isRejected = false,
  }: PaginationParams) {
    return await this.prisma.folders.findMany({
      skip: +decalage,
      take: +limit,
      where: {
        departement: {
          isCreditAgricole: true,
        },
        isValidateBeforeSignature: isValidate ? true : false,
        isRejected: isRejected ? true : false,
      },
    });
  }

  async folderValidationByServiceReseau(
    id: string,
    data: FolderValidationDto,
    supabase_id: string,
  ) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
      },
    });
    let donne = {};
    if (!data.isValidate) {
      donne = {
        isRejected: true,
        rejected: {
          connect: {
            id: connectedUser.id,
          },
        },
      };
    }
    return await this.prisma.folders.update({
      where: {
        id,
      },
      data: {
        isValidateBeforeSignature: data.isValidate,
        ...donne,
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.folders.findUnique({
      where: { id },
      include: {
        createdBy: true,
        signateurs: true,
        signatures: true,
        departement: true,
        documents: true,
      },
    });
  }

  async update(id, dto: UpdateFoldersDto) {
    const data = await this.findOne(id);
    if (!data) throw new NotFoundException("L'identifiant id n'existe pas");
    return await this.prisma.folders.update({
      where: { id },
      data: {
        title: dto.title ?? data.title,
        description: dto.description ?? data.description,
        nom: dto.nom ?? data.nom,
        adress: dto.adress ?? data.adress,
        telephone: dto.telephone ?? data.telephone,
        email: dto.email ?? data.email,
        isDefault: dto.isDefault ?? data.isDefault,
        createdById: dto.createdById ?? data.createdById,
        documents: dto.documents ?? data.documents,
        departementId: dto.departementId ?? data.departementId,
      },
    });
  }

  async delete(id: string) {
    return await await this.prisma.folders.delete({
      where: { id },
    });
  }
}
