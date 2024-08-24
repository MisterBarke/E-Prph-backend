import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function generatePassword(): Promise<string> {
  const password = `123456`; // Remplacer par une génération plus sécurisée en production
  const saltOrRounds = 10;
  return await bcrypt.hash(password, saltOrRounds);
}

async function main() {
  const email = 'superadmin@gmail.com';
  const position = 'Developer';
  const role: Role = Role.SUDO;

  const hashedPassword = await generatePassword();

 
    const newUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        role,
        position,
        createdAt: new Date(),
        phone:''
      },
    });

    console.log('User created:', newUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
