import { PrismaClient } from '@prisma/client';

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {

  // Create a sudo user
  const sudoUser = await prisma.users.create({
    data: {
      email: 'softart@test.com',
      supabase_id: '456tggtyeehgghpoiujh5678i',
      phone: '1234567890',
      role: 'SUDO',
      isPasswordInit: true,
      // Add other fields if necessary
    },
  });
  console.log('Sudo user created:', sudoUser);
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
   console.log('sudo created');
   
    await prisma.$disconnect();
  });
