import {
  Injectable,
  NotFoundException,
  Post,
  ConflictException,
} from '@nestjs/common';
import {
  CreateTestsDto,
  UpdateTestsDto,
  PaginationParams,
} from './dto/tests.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Tests } from '@prisma/client';

@Injectable()
export class TestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTestsDto): Promise<Tests> {
    const newData = await this.prisma.tests.create({
      data: {
        name: dto.name,
      },
    });
    return newData;
  }

  async findAll({
    limit,
    decalage,
    dateDebut,
    dateFin,
  }: PaginationParams): Promise<Tests[]> {
    return await this.prisma.tests.findMany({
      skip: decalage,
      take: limit,
    });
  }

  async findOne(id: string): Promise<Tests | null> {
    return await this.prisma.tests.findUnique({
      where: { id },
    });
  }

  async update(id: string, dto: UpdateTestsDto): Promise<Tests> {
    const data = await this.findOne(id);
    if (!data) throw new NotFoundException("L'identifiant id n'existe pas");
    return await this.prisma.tests.update({
      where: { id },
      data: {
        name: dto.name ?? data.name,
      },
    });
  }

  async delete(id: string): Promise<Tests> {
    return await await this.prisma.tests.delete({
      where: { id },
    });
  }
}
