import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';

const supervisors = [
  { firstName: 'Ahmed',   lastName: 'Al-Rashid', email: 'ahmed@hemaya.ae',   phone: '+971-50-100-0001' },
  { firstName: 'Sara',    lastName: 'Johnson',   email: 'sara@hemaya.ae',    phone: '+971-50-100-0002' },
  { firstName: 'Omar',    lastName: 'Hassan',    email: 'omar@hemaya.ae',    phone: '+971-50-100-0003' },
  { firstName: 'Priya',   lastName: 'Nair',      email: 'priya@hemaya.ae',   phone: '+971-50-100-0004' },
  { firstName: 'Carlos',  lastName: 'Mendez',    email: 'carlos@hemaya.ae',  phone: '+971-50-100-0005' },
  { firstName: 'Fatima',  lastName: 'Al-Zahra',  email: 'fatima@hemaya.ae',  phone: '+971-50-100-0006' },
  { firstName: 'Raj',     lastName: 'Patel',     email: 'raj@hemaya.ae',     phone: '+971-50-100-0007' },
  { firstName: 'Maria',   lastName: 'Santos',    email: 'maria@hemaya.ae',   phone: '+971-50-100-0008' },
];

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const defaultPassword = await bcrypt.hash('Supervisor@123456', 12);

  for (const s of supervisors) {
    const exists = await userRepo.findOne({ where: { email: s.email } });
    if (exists) continue;
    const user = userRepo.create({ ...s, password: defaultPassword, role: 'supervisor', isActive: true });
    await userRepo.save(user);
    console.log(`✓ Created supervisor: ${s.email}`);
  }
}
