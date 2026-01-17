/**
 * @what Prisma seed script
 * @why 開発環境の初期データ投入
 */

import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user for development
  const passwordHash = await bcrypt.hash('Password123', 12);

  const testUser = await prisma.authUser.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      email: 'dev@example.com',
      passwordHash,
    },
  });

  console.log(`✅ Created test user: ${testUser.email}`);

  // Create additional test users if needed
  const additionalUsers = [
    { email: 'admin@example.com', passwordHash },
    { email: 'user@example.com', passwordHash },
  ];

  for (const userData of additionalUsers) {
    const user = await prisma.authUser.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`✅ Created test user: ${user.email}`);
  }

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
