import { PrismaClient, Role } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPERBASE_PROJECT_URL;
const supabaseKey = process.env.SUPERBASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and API Key must be provided.');
}

// const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
//   auth: {
//     persistSession: false,
//   },
// })

async function generatePassword(): Promise<string> {
  return `123456`; // Remplacer par une génération plus sécurisée en production
}

async function main() {
  const email = 'superadmin@gmail.com';
  const position = 'Developer';
  const role: Role = Role.SUDO;

  const password = await generatePassword();

  //   const { data, error } = await supabaseClient.auth.signUp({
  //     email : email,
  //     password: password
  //   });
  // console.log('data  '+data.user);

  // if (error) {
  //   throw new Error(`Error during sign up: ${error.code, error.status}`);
  // }

  // const { user } = data;

  //   const newUser = await prisma.users.create({
  //     data: {
  //       email,
  //       supabase_id: user.id,
  //       phone: user.phone ?? '',
  //       role,
  //       createdAt: new Date(user.created_at),
  //     },
  //   });

  //  await prisma.users.findUnique({
  //     where: { supabase_id: user.id }
  //   });

  //   const updatedUser = await prisma.users.update({
  //     where: { id: newUser.id },
  //     data: {
  //       isSignateurDossierAgricole: false,
  //       position
  //     },
  //   });

  //   console.log('User created:', updatedUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
