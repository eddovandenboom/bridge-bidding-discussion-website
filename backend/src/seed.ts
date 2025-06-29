import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bridge.local' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@bridge.local',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@bridge.local' },
    update: {},
    create: {
      username: 'bridgeplayer',
      email: 'user@bridge.local',
      password: userPassword,
      role: 'USER',
    },
  });

  // Create some common labels
  const labels = [
    { name: 'Slam Hand', color: '#DC2626', description: 'Hands with slam potential' },
    { name: 'Competitive', color: '#F59E0B', description: 'Competitive bidding situations' },
    { name: 'Sacrifice', color: '#EF4444', description: 'Sacrifice bidding' },
    { name: 'Double', color: '#7C3AED', description: 'Hands involving doubles' },
    { name: 'No Trump', color: '#059669', description: 'No trump contracts' },
    { name: 'Preempt', color: '#DB2777', description: 'Preemptive bidding' },
    { name: 'Convention', color: '#2563EB', description: 'Conventional bids and responses' },
  ];

  for (const labelData of labels) {
    await prisma.label.upsert({
      where: { name: labelData.name },
      update: {},
      create: labelData,
    });
  }

  // No demo tournament - users can import their own PBN files

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: admin@bridge.local / (password from env)`);
  console.log(`👤 Test user: user@bridge.local / user123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });