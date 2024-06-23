import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// initialize Prisma Client
const prisma = new PrismaClient();

// Supabase configuration
const supabaseUrl = process.env.SUPERBASE_PROJECT_URL;
const supabaseKey = process.env.SUPERBASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'companysoftart@gmail.com';
  const password = '123456'; // Assurez-vous d'utiliser un mot de passe sécurisé
  const phone = '1234567890';

  // Create user in Supabase
  const { data: supabaseUser, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error creating user in Supabase:', error.message);
    return;
  }

  // Create a sudo user in MongoDB
  const sudoUser = await prisma.users.create({
    data: {
      email,
      supabase_id: supabaseUser?.user?.id,
      phone,
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
