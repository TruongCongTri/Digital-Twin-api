// prisma/seed.ts
import { prisma } from '../src/common/configs/prisma'; // Import your pre-configured client!
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional, useful for clean resets)
  await prisma.user.deleteMany();
  console.log('🧹 Cleared existing users.');

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const userPassword = await bcrypt.hash('User@123', salt);

  // 1. Create an APPROVED Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@digitaltwin.com',
      password: adminPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin Created: ${admin.email}`);

  // 2. Create an APPROVED Standard User
  const standardUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      fullName: 'Standard Engineer',
      role: 'USER',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
    },
  });
  console.log(`✅ Approved User Created: ${standardUser.email}`);

  // 3. Create a PENDING Standard User (For testing QA/QC Dashboard)
  const pendingUser = await prisma.user.create({
    data: {
      email: 'pending@example.com',
      password: userPassword,
      fullName: 'New Applicant',
      role: 'USER',
      accountStatus: 'PENDING',
      isEmailVerified: true,
    },
  });
  console.log(`✅ Pending User Created: ${pendingUser.email}`);

  console.log('🎉 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });