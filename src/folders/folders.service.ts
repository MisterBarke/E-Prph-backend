import {
  Injectable,
  NotFoundException,
  Post,
  ConflictException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateFoldersDto,
  UpdateFoldersDto,
  PaginationParams,
  FolderValidationDto,
  AssignSignateurDto,
  FolderSignatureDto,
  FolderVisibilityByAccountantDto,
  ShareToDto,
} from './dto/folders.dto';
import { PrismaService } from '../prisma/prisma.service';
import { log } from 'console';
import { MailService } from 'src/mail/mail.service';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class FoldersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private uploadService: UploadService
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

    await this.assignSignateursToFolder(
      newData.id,
      {
        signateurs: dto?.signateurs,
      },
      userId,
    );

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

  async getAllFolders(
    { 
      limit,
      decalage,
      dateDebut,
      dateFin,
      isSigningEnded=false,
      isValidate = false,
      isRejected=false
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
    let folders = []
    folders = await this.prisma.folders.findMany({
        skip: +decalage,
        take: +limit,
        where: {
          OR:[
            {
              createdBy: {
                id: connectedUser.id,
              },
            },
            {
              isSigningEnded: isSigningEnded ? true : false,
            },
            {
              departement:{
                isAgency:true
              },
              isValidateBeforeSignature: isValidate ? true : false,
              isRejected: isRejected ? true : false,
            },
            {
              isSigningEnded: isSigningEnded ? true : false,
              signateurs: {
                some: {
                  userId: connectedUser.id,
                },
              },
            },
            {
              sharedTo:{
                some:{
                  userId: connectedUser.id
                }
              }
            }
          ],
          isSigningEnded: isSigningEnded ? true : false,
        },
        include: {
          documents: true,
          departement: true,
          createdBy: true,
          signateurs: {
            include: {
              user: true,
            },
            orderBy: { order: 'asc' },
          },
          signatures: {
            include:{ user:true}
          },
        },
        
      });
      for (const folder of folders) {
        for (const doc of folder.documents) {
          const url = await this.uploadService.getSignedUrl(doc.url); 
          doc.url = url;
        }
        for (const signateur of folder.signateurs) {
          if (signateur.user && signateur.user.userSignatureUrl) {
            const signedUrl = await this.uploadService.getSignedUrl(signateur.user.userSignatureUrl);
            signateur.user.userSignatureUrl = signedUrl;
          }
        }
        for (const signature of folder.signatures) {
          if (signature.user && signature.user.userSignatureUrl) {
            const signedUrl = await this.uploadService.getSignedUrl(signature.user.userSignatureUrl);
            signature.user.userSignatureUrl = signedUrl;
          }
        }

      }  
      return folders;  
    }

  async folderValidationByServiceReseau(
    id: string,
    data: FolderValidationDto,
    userId: string
  ) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId
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

  async assignSignateursToFolder(
    id: string,
    dto: AssignSignateurDto,
    userId: string,
  ) {
    if (!dto?.signateurs || !dto?.signateurs?.length) return;
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        departement: true,
      },
    });
    if (connectedUser.role !== 'ADMIN_MEMBER') {
      throw new UnauthorizedException();
    }
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
      const signateurs = await Promise.all(
        dto.signateurs.map(async (userId, index) => {
          let signateur = await this.prisma.signateurs.findFirst({
            where: { userId, folderId: id },
          });

         if (!signateur) {
        signateur = await this.prisma.signateurs.create({
          data: {
            userId,
            folderId: id,
            order: index, 
          },
        });
      }

        return signateur;
      }),
    );

    try {
      for (let i = 0; i < signateurs.length; i++) {
        const idsign = signateurs[i].id;
        await this.prisma.folders.update({
          where: { id },
          data: {
            signateurs: {
              connect: {
                id: idsign,
              },
            },
          },
        });
      }

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
          orderBy: {
            order: 'asc',
          },
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

    const nextSignatory = await this.prisma.signateurs.findFirst({
      where:{
        order: signaturePosition,
        folderId
      },
      include:{
        user:true
      }
    })
    console.log("nexsignatory  "+nextSignatory.user.email);
    
    
    if (nextSignatory.userId !== connectedUser.id) {
      throw new HttpException(
        `Respecter ordre de signature, ${nextSignatory.user.position} doit d'abord signer`,
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
        signateurs: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (updatedFolder.signaturePosition === folder.signateurs.length) {
      await this.prisma.folders.update({
        where: { id: folderId },
        data: {
          isSigningEnded: true,
        },
      });
    }

    /* const newNextSignatory = await this.prisma.signateurs.findFirst({
      where:{
        order: updatedFolder.signaturePosition
      },
      include:{
        user:true
      }
    }) */

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

  async findOne(id: string, userId: string) {
      const oneFolder = await this.prisma.folders.findUnique({
        where: { id, createdBy:{id: userId} },
        include: {
          createdBy: true,
          signateurs: {
            include: {
              user: true,
            },
            orderBy: { 
              order: 'asc',
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
        
        for (const doc of oneFolder.documents) {
          const url = await this.uploadService.getSignedUrl(doc.url); 
          doc.url = url;
        }
        for (const signateur of oneFolder.signateurs) {
          if (signateur.user && signateur.user.userSignatureUrl) {
            const signedUrl = await this.uploadService.getSignedUrl(signateur.user.userSignatureUrl);
            signateur.user.userSignatureUrl = signedUrl;
          }
        }

        for (const signature of oneFolder.signatures) {
          if (signature.user && signature.user.userSignatureUrl) {
            const signedUrl = await this.uploadService.getSignedUrl(signature.user.userSignatureUrl);
            signature.user.userSignatureUrl = signedUrl;
          }
        }
        return oneFolder 
      }
  

  async updateFolder(id: string, userId: string, dto: UpdateFoldersDto) {
    const data = await this.findOne(id, userId);
    if (!data) throw new NotFoundException("L'identifiant id n'existe pas");
     const updatedFields = await this.prisma.folders.update({
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
                id: id,
              },
            },
          },
        });
      }
    
    return updatedFields
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

    await this.prisma.shareFolderTo.deleteMany({
      where: { folderId: id },
    });

    // Supprimer le dossier
    const deletedFolder = await this.prisma.folders.delete({
      where: { id },
    });

    return deletedFolder;
  }

  async deleteFile(fileId:  string, userId: string){
    const connectedUser = await this.prisma.users.findUnique({where:{
      id: userId
    }})
    const deleteFile = await this.prisma.documents.delete({where: {
     id: fileId, 
     createdBy:{
      id: connectedUser.id
     }
    }})
    return deleteFile
   }
 

  async shareFolder(id: string, dto: ShareToDto) {
    if (!dto?.sharedTo || !dto?.sharedTo?.length) return;

    const users = await this.prisma.users.findMany({
      where: {
        id: {
          in: dto.sharedTo,
        },
      },
    });

    if (users.length !== dto.sharedTo.length) {
      const existingIds = users.map((user) => user.id);
      const nonExistingIds = dto.sharedTo.filter(
        (id) => !existingIds.includes(id),
      );
      throw new HttpException(
        `Id ${nonExistingIds.join(' ||| ')} incorrects`,
        400,
      );
    }

    const sharedToUsers = await Promise.all(
      dto.sharedTo.map(async (userId) => {
        let sharedToUser = await this.prisma.shareFolderTo.findFirst({
          where: { userId, folderId: id },
        });

        if (!sharedToUser) {
          sharedToUser = await this.prisma.shareFolderTo.create({
            data: {
              userId,
              folderId: id,
            },
          });
        }

        return sharedToUser;
      }),
    );

    try {
      await this.prisma.folders.update({
        where: { id },
        data: {
          sharedTo: {
            connect: sharedToUsers.map((user) => ({ id: user.id })),
          },
        },
      });

      const folder = await this.prisma.folders.findUnique({
        where: {
          id,
        },
      });
     for (let i = 0; i < users.length; i++) {
      await this.mailService.courierNotification({
        email: users[i].email,
        subject: 'Courier',
        title: 'Nouveau Courier',
        companyName: 'BAGRI Niger',
        companyContry: 'Niger',
        template: 'courierNotifications',
        context: {
          username: users[i].name,
          folderName: folder.title,
          folderNumber: `${folder.number}`,
        },
      });
     }
    

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

  async getAllCourier(
    { limit, decalage}: PaginationParams,
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
          sharedTo: {
            some: {
              userId: connectedUser.id,
            },
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
            orderBy: { order: 'asc' },
          },
          signatures: true,
        },
      });
    }

}
