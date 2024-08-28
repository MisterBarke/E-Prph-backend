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
  FolderVisibilityByAccountantDto,
} from './dto/folders.dto';
import { PrismaService } from '../prisma/prisma.service';
import { log } from 'console';
import { MailService } from 'src/mail/mail.service';

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

    await this.assignSignateursToFolder(newData.id,{
      signateurs: dto?.signateurs,
    }, userId);

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

  async getFoldersByAdmins(
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
    if (
      connectedUser.role === 'ADMIN_MEMBER' 
    ) {
      return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
          createdBy: {
            id: connectedUser.id,
          },

        },
        include: {
          documents: true,
          departement: true,
          createdBy: true,
          signateurs: {
            include: {
              user: true,
            },
          },
          signatures: true,
        },
      });
    }
    
    if (connectedUser.role == 'ADMIN') {
      return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        include: {
          documents: true,
          departement: true,
          createdBy: true,
          signateurs: true,
          signatures: true,
        },
      });
    }
  }

  async getFoldersBySignatory(
    { limit, decalage, dateDebut, dateFin }: PaginationParams,
    userId: string,
  ) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    return await this.prisma.folders.findMany({
      skip: +decalage,
      take: +limit,
      where: {
        signateurs: {
          some: {
            userId: connectedUser.id,
          },
        },
        
      },
      include: {
        documents: true,
        signateurs: {
          include: {
            user: true,
          },
        },
        createdBy: true,
        signatures: true
      },
    });
  }

  async getSignedFolders(
    {
      limit,
      decalage,
      dateDebut,
      dateFin,
      isSigningEnded = false,
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
    if (connectedUser.role === 'ADMIN') {
      return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
          isSigningEnded: isSigningEnded ? true : false,
        },
        include: {
          documents: true,
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
        },
      });
    }
    if (connectedUser.role === 'ADMIN_MEMBER') {
      return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
          createdBy: {
            id: connectedUser.id,
          },
          isSigningEnded: isSigningEnded ? true : false,
        },
        include: {
          documents: true,
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
        },
      });
    }
    if (connectedUser.role === 'MEMBER') {
      return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
          signateurs: {
            some: {
              userId: connectedUser.id,
            },
          },
          isSigningEnded: isSigningEnded ? true : false,
        },
        include: {
          documents: true,
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
        },
      });
    }
  }

  async assignSignateursToFolder(id: string, dto: AssignSignateurDto, userId: string,) {
    if (!dto?.signateurs || !dto?.signateurs?.length) return;
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        departement: true,
      },
    });
    const users = await this.prisma.users.findMany({
      where: {
        id: {
          in: dto.signateurs,
        },
      },
    });

    if (users.length !== dto.signateurs.length) {
      const existingIds = users.map((user) => user.id);
      const nonExistingIds = dto.signateurs.filter(
        (id) => !existingIds.includes(id),
      );
      throw new HttpException(
        `Id ${nonExistingIds.join(' ||| ')} incorrects`,
        400,
      );
    }
 
    const serviceReseauUser = dto.signateurs.map(async (userId) => {
    let user = await this.prisma.users.findUnique({
      where:{id: userId, departement: {isServiceReseau:true}}
    })
    return user
    })
    if (connectedUser.departement.isFromNiamey === false && !serviceReseauUser) {
      throw new HttpException(
       "Veuillez sélectionner un signataire du service réseau dans la liste des signataires du dossier",
        400,
      );
    }
    const signateurs = await Promise.all(
      dto.signateurs.map(async (userId) => {
        let signateur = await this.prisma.signateurs.findFirst({
          where: { userId, folderId: id },
        });

        if (!signateur) {
          signateur = await this.prisma.signateurs.create({
            data: {
              userId,
              folderId: id,
            },
          });
        }

        return signateur;
      }),
    );

    try {
      await this.prisma.folders.update({
        where: { id },
        data: {
          signateurs: {
            connect: signateurs.map((signateur) => ({ id: signateur.id })),
          },
        },
      });

      const folder = await this.prisma.folders.findUnique({
        where: {
          id,
        },
      });

      await this.mailService.sendNoticationForSignature({
        email: users[0].email,
        subject: 'Nouvelle demande de signature',
        title: 'Notification de Signature',
        companyName: 'BAGRI Niger',
        companyContry: 'Niger',
        template: 'notification',
        context: {
          username: users[0].name,
          folderName: folder.title,
          folderNumber: `${folder.number}`,
        },
      });

      return 'Signatories added';
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

 /*async folderValidationByServiceReseau(
    id: string,
    data: FolderValidationDto,
    userId: string,
  ) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
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
  }*/

  async signFolder(userId: string, folderId: string, dto: FolderSignatureDto) {
    // Find the connected user based on userId
    const connectedUser = await this.prisma.users.findUnique({
      where: { id: userId },
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

    const userSignateur = folder.signateurs.find(
      (signateur) => signateur.userId === connectedUser.id,
    );
    if (!userSignateur) {
      throw new HttpException(
        "Vous n'etes pas autorisé à signer ce dossier",
        400,
      );
    }

    const signatureExistant = await this.prisma.signatures.findFirst({
      where: { folderId, userId: connectedUser.id },
    });
    if (signatureExistant) throw new HttpException('Document déjà signé', 400);

    const nextSignateur = folder.signateurs[signaturePosition];
    if (nextSignateur.userId !== connectedUser.id) {
      throw new HttpException(
        `Respecter ordre de signature, ${nextSignateur.user.position} doit d'abord signer`,
        400,
      );
    }

    await this.prisma.signateurs.update({
      where: { id: userSignateur.id },
      data: { hasSigned: true },
    });

    await this.prisma.folders.update({
      where: { id: folderId },
      data: {
        signaturePosition: signaturePosition + 1,
      },
    });

    const updatedFolder = await this.prisma.folders.findUnique({
      where: { id: folderId },
      include: {
        signateurs: true,
      },
    });

    if (updatedFolder.signaturePosition === folder.signateurs.length) {
      await this.prisma.folders.update({
        where: { id: folderId },
        data: {
          isSigningEnded: true,
        },
      });
      return 'Tout le monde a signé. Dossier clot';
    }

    const signature = await this.prisma.signatures.create({
      data: {
        signedAt: new Date(),
        folder: { connect: { id: folderId } },
        description: dto.description,
        user: { connect: { id: connectedUser.id } },
      },
    });

    await this.mailService.sendNoticationForSignature({
      email: nextSignateur.user.email,
      subject: 'Nouvelle demande de signature',
      title: 'Notification de Signature',
      companyName: 'BAGRI Niger',
      companyContry: 'Niger',
      template: 'notification',
      context: {
        username: nextSignateur.user.name,
        folderName: folder.title,
        folderNumber: `${folder.number}`,
      },
    });

    return signature;
  }

  async findOne(id: string) {
    console.log(id);
    try {
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
    } catch (error) {
      console.log(error);
      
    }
    
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

  async updateVisibilityByAccountant(
    folderId: string,
    data: FolderVisibilityByAccountantDto,
    userId: string,
  ) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    const folder = await this.prisma.folders.findFirst({
      where: {
        id: folderId,
        createdBy: {
          id: connectedUser.id,
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Aucun dossier trouvé');
    }

    return await this.prisma.folders.update({
      where: {
        id: folder.id,
      },
      data: {
        isVisibleByAccountant: data.isVisible,
      },
    });
  }

  async delete(id: string) {
    // Supprimer les documents associés au dossier
    await this.prisma.documents.deleteMany({
      where: { folderId: id },
    });

    // Supprimer les signateurs associés au dossier
    await this.prisma.signateurs.deleteMany({
      where: { folderId: id },
    });

    // Supprimer les signatures associées au dossier
    await this.prisma.signatures.deleteMany({
      where: { folderId: id },
    });

    // Supprimer le dossier
    const deletedFolder = await this.prisma.folders.delete({
      where: { id },
    });

    return deletedFolder;
  }
}
