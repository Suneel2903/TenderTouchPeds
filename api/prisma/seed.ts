import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_DEFAULT_EMAIL;
  const password = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_DEFAULT_EMAIL and ADMIN_DEFAULT_PASSWORD must be set');
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: { password: hashed },
    create: {
      email,
      password: hashed,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded admin user ${email}`);

  // Seed default time slots
  const defaultSlots = [
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '1:00 PM',
    '1:30 PM',
    '2:00 PM',
    '5:00 PM',
    '5:30 PM',
    '6:00 PM',
    '6:30 PM',
    '7:00 PM',
    '7:30 PM',
    '8:00 PM',
  ];

  for (const slot of defaultSlots) {
    await prisma.timeSlot.upsert({
      where: { slot },
      update: {},
      create: {
        slot,
        isActive: true,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${defaultSlots.length} default time slots`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed error', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


