import {
  Injectable,
  NotFoundException,
  Post,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateUsersDto,
  UpdateUsersDto,
  PaginationParams,
  pwrdEmailValidationDTO,
} from './dto/users.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  supabaseClient: SupabaseClient;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // this.supabaseClient = createClient(
    //   this.configService.get<string>('supabase.url'),
    //   this.configService.get<string>('supabase.key'),
    //   {
    //     auth: {
    //       persistSession: false,
    //     },
    //   },
    // );
  }
  async findDuplicates(data) {
    const duplicateValues = await this.prisma.users.findFirst({
      where: {
        OR: [
          {
            email: data.email,
          },
        ],
        id: {
          not: {
            equals: data?.id,
          },
        },
      },
    });
    if (duplicateValues) {
      throw new ConflictException();
    }
  }
  async create(dto: CreateUsersDto) {
    await this.findDuplicates({
      email: dto.email,
      supabase_id: dto.supabase_id,
    });
    const newData = await this.prisma.users.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        password: '',
      },
    });
    return newData;
  }

  async findAll({ limit, decalage, dateDebut, dateFin }: PaginationParams) {
    return await this.prisma.users.findMany({
      skip: decalage,
      take: limit,
      include: {
        departement: true,
      },
    });
  }

  async findAllSignateur({ isSignateurDossierAgricole }: PaginationParams) {
    return await this.prisma.users.findMany({
      where: {
        role: 'MEMBER',
      },
      include: {
        departement: true,
      },
    });
  }

  async findAllDepartementMember(userId: string) {
    const connectedUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        departement: true,
      },
    });
    return await this.prisma.users.findMany({
      where: {
        departement: {
          id: connectedUser.departement?.id,
        },
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.users.findUnique({
      where: { id },
    });
  }

  async findOneBySupabaseId(userId: string) {
    return await this.prisma.users.findUnique({
      where: { id: userId },
    });
  }

  async update(id, dto: UpdateUsersDto) {
    await this.findDuplicates({
      email: dto.email,
      supabase_id: dto.supabase_id,
      id,
    });
    const data = await this.findOne(id);
    if (!data) throw new NotFoundException("L'identifiant id n'existe pas");
    return await this.prisma.users.update({
      where: { id },
      data: {
        email: dto.email ?? data.email,
        phone: dto.phone ?? data.phone,
        name: dto.name ?? data.name,
        matricule: dto.matricule ?? data.matricule,
      },
    });
  }

  async changeRole(id, dto: UpdateUsersDto) {
    const data = await this.findOne(id);
    if (!data) throw new NotFoundException("L'identifiant id n'existe pas");
    return await this.prisma.users.update({
      where: { id },
      data: {
        role: dto.role,
      },
    });
  }

  async delete(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: {
        signatures: true,
        signateursRole: true,
        documents: true,
        folders: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.prisma.signatures.deleteMany({
      where: { userId: id },
    });

    await this.prisma.signateurs.deleteMany({
      where: { userId: id },
    });

    await this.prisma.documents.deleteMany({
      where: { createdById: id },
    });

    await this.prisma.folders.deleteMany({
      where: { createdById: id },
    });

    // Delete the user
    const deletedUser = await this.prisma.users.delete({
      where: { id },
    });

    return deletedUser;
  }

  async forgotPassword(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    try {
      const changePwd = await this.prisma.users.update({
        where: { id },
        data: { isPasswordInit: false },
      });
      return changePwd;
    } catch (error) {
      console.error(error);
    }
  }

  async pwrdEmailValidation(dto:pwrdEmailValidationDTO) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
      return user
  }
}
