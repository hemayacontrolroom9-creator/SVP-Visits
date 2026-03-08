import { DataSource } from 'typeorm';
import { Site } from '../../sites/entities/site.entity';

const sites = [
  {
    name: 'Al Barsha Commercial Center',
    code: 'ABM-001',
    address: 'Sheikh Zayed Rd, Al Barsha, Dubai',
    city: 'Dubai',
    latitude: 25.1124,
    longitude: 55.1986,
    geofenceRadius: 200,
    requiresQrVerification: true,
    requiresGpsVerification: true,
    isActive: true,
    contactName: 'Building Manager',
    contactPhone: '+971-4-123-4001',
  },
  {
    name: 'Dubai Marina Tower B',
    code: 'DMT-002',
    address: 'Marina Walk, Dubai Marina, Dubai',
    city: 'Dubai',
    latitude: 25.0792,
    longitude: 55.1403,
    geofenceRadius: 150,
    requiresQrVerification: true,
    requiresGpsVerification: true,
    isActive: true,
    contactName: 'Security Desk',
    contactPhone: '+971-4-123-4002',
  },
  {
    name: 'Jumeirah Beach Resort',
    code: 'JBH-003',
    address: 'Jumeirah Beach Rd, Jumeirah, Dubai',
    city: 'Dubai',
    latitude: 25.2285,
    longitude: 55.2432,
    geofenceRadius: 300,
    requiresQrVerification: false,
    requiresGpsVerification: true,
    isActive: true,
    contactName: 'Resort Security',
    contactPhone: '+971-4-123-4003',
  },
  {
    name: 'DIFC Gate Village',
    code: 'DGV-004',
    address: 'Gate Village, DIFC, Dubai',
    city: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    geofenceRadius: 100,
    requiresQrVerification: true,
    requiresGpsVerification: true,
    isActive: true,
    contactName: 'DIFC Security',
    contactPhone: '+971-4-123-4004',
  },
  {
    name: 'Deira Gold Souk',
    code: 'DGS-005',
    address: 'Gold Souk, Deira, Dubai',
    city: 'Dubai',
    latitude: 25.2726,
    longitude: 55.3060,
    geofenceRadius: 250,
    requiresQrVerification: false,
    requiresGpsVerification: true,
    isActive: true,
    contactName: 'Souk Management',
    contactPhone: '+971-4-123-4005',
  },
  {
    name: 'Yas Island Facility',
    code: 'YIF-006',
    address: 'Yas Island, Abu Dhabi',
    city: 'Abu Dhabi',
    latitude: 24.4975,
    longitude: 54.6083,
    geofenceRadius: 500,
    requiresQrVerification: true,
    requiresGpsVerification: true,
    isActive: true,
    contactName: 'Facility Manager',
    contactPhone: '+971-2-123-4006',
  },
];

export async function seedSites(dataSource: DataSource): Promise<void> {
  const siteRepo = dataSource.getRepository(Site);
  for (const s of sites) {
    const exists = await siteRepo.findOne({ where: { code: s.code } });
    if (exists) continue;
    const site = siteRepo.create(s);
    await siteRepo.save(site);
    console.log(`✓ Created site: ${s.name}`);
  }
}
