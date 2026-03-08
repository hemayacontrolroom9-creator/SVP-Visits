import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: 'admin@hemaya.ae' } });
  if (existing) {
    console.log('Admin user already exists, skipping.');
    return;
  }

  const admins = [
    {
      email: 'admin@hemaya.ae',
      password: await bcrypt.hash('Admin@123456', 12),
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin',
      phone: '+971-4-000-0001',
      isActive: true,
    },
    {
      email: 'manager@hemaya.ae',
      password: await bcrypt.hash('Manager@123456', 12),
      firstName: 'Operations',
      lastName: 'Manager',
      role: 'manager',
      phone: '+971-4-000-0002',
      isActive: true,
    },
  ];

  for (const admin of admins) {
    const user = userRepo.create(admin);
    await userRepo.save(user);
    console.log(`✓ Created user: ${admin.email}`);
  }
}
