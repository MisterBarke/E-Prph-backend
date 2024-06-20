import {
  Injectable,
  NotFoundException,
  Post,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import {
  CreateFoldersDto,
  UpdateFoldersDto,
  PaginationParams,
  FolderValidationDto,
  AssignSignateurDto,
  FolderSignatureDto,
} from './dto/folders.dto';
import { PrismaService } from '../prisma/prisma.service';
import { log } from 'console';

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
        description: dto.description ?? '',
        nom: dto.nom ?? '',
        adress: dto.adress ?? '',
        telephone: dto.telephone ?? '',
        email: dto.email ?? '',
        isValidateBeforeSignature: connectedUser.departement.isCreditAgricole
          ? false
          : true,
        createdBy: {
          connect: {
            id: connectedUser.id,
          },
        },
        departement: {
          connect: {
            id: connectedUser.departement.id,
          },
        },
      },
    });

    await this.assignSignateursToFolder(newData.id, {
      signateurs: dto?.signateurs,
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
          isPrincipal: element.isPrincipal ?? false,
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
      isValidate,
      isRejected = false,
    }: PaginationParams,
    supabase_id: string,
  ) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
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
        isValidateBeforeSignature: true,
        isRejected,
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
      include: {
        documents: true,
      },
    });
  }

  async getFoldersBySignatory({
    limit,
    decalage,
    dateDebut,
    dateFin,
    isRejected = false,
    isValidate = true,
  }: PaginationParams, supabase_id: string) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
      },
    });
    if (connectedUser.isSignateurDossierAgricole == true) {
      return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
          departement: {
            isCreditAgricole: true,
          },
          isValidateBeforeSignature: isValidate,
          isRejected: isRejected,
        },
        include: {
          documents: true,
        },
      });
    }else{
      return 'Vous n\'etes pas autorisé à voir ces informations';
    }

  }

  async assignSignateursToFolder(id: string, dto: AssignSignateurDto) {
    if (!dto?.signateurs || !dto?.signateurs?.length) return;
    const users = await this.prisma.users.findMany({
      where: {
            id: {
                in: dto.signateurs,
        },
      },
    });
    if (users.length != dto.signateurs.length) {
      const ids = users.map((el) => el.id);
      const rest = dto.signateurs.filter((el) => !ids.includes(el));
      console.log(users, dto.signateurs);
      throw new HttpException(`Id ${rest.join(' ||| ')} incorrects ${users}, ${dto.signateurs}`, 400,);
    }
    for (let i = 0; i < dto.signateurs.length; i++) {
      const element = dto.signateurs[i];
      await this.prisma.folders.update({
        where: {
          id,
        },
        
        data: {
          signateurs: {
            connect: {
              id: element,
            },
          },
        },
      }); 
    }
    return 'updated';
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

  async signFolder(
    supabase_id: string,
    folderId: string,
    dto: FolderSignatureDto,
  ) {
    //Qui va signer avant qui l'ordre du tableau
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
      },
    });

    const folder = await this.prisma.folders.findUnique({
      where: {
        id: folderId,
      },
      include: {
        signateurs: {
          include: {
            user: true,
          },
        },
        departement: true,
        signatures: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!folder) throw new HttpException('le Dossier est incorrect', 400);

    if (folder.departement.isCreditAgricole) {
      //Retreive Signateurs
      const signateurs = await this.prisma.users.findMany({
        where: { isSignateurDossierAgricole: true },
      });

      let position = 0;
        signateurs?.forEach((el) => {
            if (el.signaturePosition > position) position = el.signaturePosition;
      });
      if (position != 0) {
        //Respect de l'ordre
        const sortedSignateurs = signateurs?.sort((a, b) =>
          a.signaturePosition > b.signaturePosition ? 1 : -1,
        );
        const normalSignateur =
          sortedSignateurs[
            sortedSignateurs.findIndex(
              (el) => el.signaturePosition == position,
            ) + 1
          ];
        if (normalSignateur.id != connectedUser.id)
          throw new HttpException(
            `Respecter ordre de signateur ${normalSignateur.email} avant`,
            400,
          );
      }
    } else {
      let isSignateurThisFolder = false;
      folder.signateurs?.forEach((sign) => {
        if (sign.userId == connectedUser.id) isSignateurThisFolder = true;
      });

      if (!isSignateurThisFolder)
        throw new HttpException('Signature refuser', 400);
      let position = 0;
      folder.signatures?.forEach((el) => {
        if (el.user.signaturePosition > position)
          position = el.user.signaturePosition;
      });
      if (position != 0) {
        //Respect de l'ordre
        const sortedSignateurs = folder.signateurs?.sort((a, b) =>
          a.user.signaturePosition > b.user.signaturePosition ? 1 : -1,
        );
        const normalSignateur =
          sortedSignateurs[
            sortedSignateurs.findIndex(
              (el) => el.user.signaturePosition == position,
            ) + 1
          ];
        if (normalSignateur.userId != connectedUser.id)
          throw new HttpException(
            `Respecter ordre de signateur ${normalSignateur.user.email} avant`,
            400,
          );
      }
    }

    const signatureExistant = await this.prisma.signatures.findFirst({
      where: {
        folderId,
        userId: connectedUser.id,
      },
    });
    if (signatureExistant) throw new HttpException('Document déjà signé', 400);
      const signatures = await this.prisma.signatures.create({
          data: {
              signedAt: new Date(),
              
              folder: {
                  connect: {
                      id: folderId,
                  },
              },
              
              description: dto.description,
              user: {
                  connect: {
                      id: connectedUser.id,
                  },
              },
          },
    });
    return signatures;
  }

  async findOne(id: string) {
    return await this.prisma.folders.findUnique({
      where: { id },
      include: {
        createdBy: true,
        signateurs: {
          include: {
            user: true,
          },
        },
        signatures: {
          include: {
            user: true,
          },
        },
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
      },
    });
  }

  async delete(id: string) {
    return await this.prisma.folders.delete({
      where: { id },
    });
  }
}
