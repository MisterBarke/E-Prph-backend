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
  constructor(private prisma: PrismaService, private mailService: MailService) {}

  async create(dto: CreateFoldersDto, supabase_id: string) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
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
        number: newNumber
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

  async getFoldersByAdmins({
  limit, decalage, dateDebut, dateFin, isValidate = false, isRejected = false,
}: PaginationParams, supabase_id: string) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
      },
      include:{
        departement: true
      }
    });
    if (connectedUser.role === 'ADMIN_MEMBER' && connectedUser.departement.isServiceReseau === false) {
      return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
          createdBy: {
            id: connectedUser.id
        },
         
        OR: [
          {
            departement: {
              isCreditAgricole: true,
            },         
            isValidateBeforeSignature: isValidate ? true : false,
            isRejected: isRejected ? true : false,
            isSigningEnded: false
          },
          {
            departement: {
              isCreditAgricole: false,  
            },
            signaturePosition: 0
          },
        ]   
        },
        include: {
          documents: true,
          departement:true,
        },
      });
    }
    if(connectedUser.departement.isServiceReseau === true){
      return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
            departement: {
              isCreditAgricole: true,
            },         
            isValidateBeforeSignature: isValidate ? true : false,
            isRejected: isRejected ? true : false,
            signaturePosition: 0
          },
         
        include: {
          documents: true,
          departement:true,
        },
      });
    }
  
  }

  async getFoldersBySignatory({
    limit,
    decalage,
    dateDebut,
    dateFin,

  }: PaginationParams, supabase_id: string) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
      },
    });
  
     return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
          signateurs:{
            some:{
              userId: connectedUser.id,
            }
          },
          OR: [
            {
              departement: {
                isCreditAgricole: true,
              },
              isValidateBeforeSignature: true,
              isRejected: false,
            },
            {
              departement:{
                isCreditAgricole: false,
              },
            }
          ]
          
        },
        include: {
          documents: true,
          signateurs:{
            include:{
              user: true
            }
          },
        },
      });
      
  }

  async getSignedFolders({
    limit,
    decalage,
    dateDebut,
    dateFin,
    isSigningEnded = false

  }: PaginationParams, supabase_id: string) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        supabase_id,
      },
      include:{
        departement:true,
      }
    });
     return await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
         isSigningEnded: isSigningEnded ? true: false
        },
        include: {
          documents: true,
          signateurs:{
            include:{
              user: true
            }  
          },
          signatures:{
            include:{
              user: true
            }
          }
        },
      });
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
      })
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
          id
        },
      });

      for (const user of users) {
        await this.mailService.sendNoticationForSignature({
          email: user.email,
          subject: 'Nouvelle demande de signature',
          title: 'Notification de Signature',
          companyName: 'Votre Entreprise',
          companyContry: 'Votre Pays',
          template: 'notification',
          context: {
            username: user.name,
            documentName: `${folder.title}`,
            folderNumber: `${folder.number}`
          }
        });
      }
  
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
    
  
    const signatureExistant = await this.prisma.signatures.findFirst({
      where: { folderId, userId: connectedUser.id },
    });
    if (signatureExistant) throw new HttpException('Document déjà signé', 400);

    const nextSignateur = folder.signateurs[signaturePosition];
    if (nextSignateur.userId !== connectedUser.id) {
      throw new HttpException(
        `Respecter ordre de signature, ${nextSignateur.user.position} doit d'abord signer`,
        400
      );
    }

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

 const updatedFolder = await this.prisma.folders.findUnique({
  where: { id: folderId },
  include: {
    signateurs: true
  }
});
 
    if (updatedFolder.signaturePosition === folder.signateurs.length){
      await this.prisma.folders.update({
        where:{id: folderId},
        data:{
          isSigningEnded: true
        }
      })
      return "Tout le monde a signé. Dossier clot"
    }

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

  async updateVisibilityByAccountant(folderId: string, data: FolderVisibilityByAccountantDto,
    supabase_id: string){
      const connectedUser = await this.prisma.users.findUnique({
        where: {
          supabase_id,
        },
      });

  const folder= await this.prisma.folders.findFirst({
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