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
            title: connectedUser.departement.title
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
  
    if (users.length !== dto.signateurs.length) {
      const existingIds = users.map((user) => user.id);
      const nonExistingIds = dto.signateurs.filter((id) => !existingIds.includes(id));
      throw new HttpException(`Id ${nonExistingIds.join(' ||| ')} incorrects`, 400);
    }
  
    const signateurs = await Promise.all(
      users.map(async (user) => {
        let signateur = await this.prisma.signateurs.findUnique({
          where: { id: user.id },
        });
  
        if (!signateur) {
          signateur = await this.prisma.signateurs.create({
            data: {
              userId: user.id,
              folderId: id, 
            },
          });
        }
  
        return signateur;
      })
    );
  
    try {
      const ids = signateurs.map((signateur) => ({ id: signateur.id }));
      await this.prisma.folders.update({
        where: { id },
        data: {
          signateurs: {
            connect: ids,
          },
        },
      });
  
      return 'updated';
    } catch (error) {
      console.error(error);
      if (error.code === 'P2018') {
        throw new HttpException('Failed to update folder with signateurs: connected records not found', 500);
      } else {
        throw new HttpException('Failed to update folder with signateurs', 500);
      }
    }
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
    // Find the connected user based on supabase_id
    const connectedUser = await this.prisma.users.findUnique({
      where: { supabase_id },
    });
    if (!connectedUser) throw new HttpException('Utilisateur non trouvé', 400);
  
    const folder = await this.prisma.folders.findUnique({
      where: { id: folderId },
      include: {
        signateurs: {
          include: { user: true },
        },
        departement: true,
        signatures: {
          include: { user: true },
        },
      },
    });
    if (!folder) throw new HttpException('Le dossier est incorrect', 400);

    const signaturePosition = folder.signaturePosition;
  
    const userSignateur = folder.signateurs.find(signateur => signateur.userId === connectedUser.id);
    if (!userSignateur) {
      throw new HttpException('Vous n\'etes pas autorisé à signer ce dossier', 400);
    }
  
    const nextSignateur = folder.signateurs[signaturePosition];
    if (nextSignateur.userId !== connectedUser.id) {
      throw new HttpException(
        `Respecter ordre de signature, ${nextSignateur.user.position} doit d'abord signer`,
        400
      );
    }

    const signatureExistant = await this.prisma.signatures.findFirst({
      where: { folderId, userId: connectedUser.id },
    });
    if (signatureExistant) throw new HttpException('Document déjà signé', 400);

    await this.prisma.signateurs.update({
      where: { id: userSignateur.id },
      data: { hasSigned: true },
    });
    
    await this.prisma.folders.update({
      where:{id: folderId},
      data:{
        signaturePosition: signaturePosition+1
      }
    })
    const signature = await this.prisma.signatures.create({
      data: {
        signedAt: new Date(),
        folder: { connect: { id: folderId } },
        description: dto.description,
        user: { connect: { id: connectedUser.id } },
      },
    });

    return signature;
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