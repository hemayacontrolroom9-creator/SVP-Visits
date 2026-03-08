import { AppDataSource } from '../data-source';
import { seedAdmin } from './admin.seed';
import { seedUsers } from './users.seed';
import { seedSites } from './sites.seed';

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connected\n');

    console.log('--- Seeding admin accounts ---');
    await seedAdmin(AppDataSource);

    console.log('\n--- Seeding supervisors ---');
    await seedUsers(AppDataSource);

    console.log('\n--- Seeding sites ---');
    await seedSites(AppDataSource);

    console.log('\n✅ All seeds completed successfully!');
    console.log('\nDefault credentials:');
    console.log('  Admin:      admin@hemaya.ae     / Admin@123456');
    console.log('  Manager:    manager@hemaya.ae   / Manager@123456');
    console.log('  Supervisor: ahmed@hemaya.ae     / Supervisor@123456');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeeds();
