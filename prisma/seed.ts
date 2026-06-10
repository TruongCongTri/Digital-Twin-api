// prisma/seed.ts
import { prisma } from '../src/common/configs/prisma'; // Import your pre-configured client!
import bcrypt from 'bcryptjs';

// The provided mock assets list
const MOCK_ASSETS = [
  {
    assetId: 'uuid-1',
    name: 'Civil Engineering Research Building',
    description: 'Main architectural BIM model',
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '0bab416bbd7c41fda0ff072568245923',
  },
  {
    assetId: 'uuid-2',
    name: '3D Scene- NLSC',
    description: 'Tree point data with CO2 metrics',
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '86d506a675294f5787075b3cbda0c123',
  },
  {
    assetId: 'uuid-3',
    name: 'NTU Campus Sensor',
    description: 'Live temperature feeds',
    fileType: 'ATTRIBUTE',
    status: 'PENDING',
    arcGisId: '66ea2417eb894182aeded18cc64a5d1f',
  },
  {
    assetId: 'uuid-5',
    name: 'National Taiwan University',
    description: 'BIM - National Taiwan University',
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '5a164cbf872e47439a813721caeef91b',
  },
  {
    assetId: 'uuid-6',
    name: 'Lake Tree Road Map',
    description: null,
    fileType: 'ATTRIBUTE',
    status: 'APPROVED',
    arcGisId: 'aa02a4d711bf451890eaebc68f4e8f7b',
  },
  {
    assetId: 'uuid-7',
    name: 'Water',
    description: null,
    fileType: 'ATTRIBUTE',
    status: 'APPROVED',
    arcGisId: 'aedb6556cda34ae8a9f97b1d98a0eae9',
  },
  {
    assetId: 'uuid-8',
    name: 'SPKL Scene',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'ebf6ae44134c4d52b7e83804d869fb7b',
  },
  {
    assetId: 'uuid-9',
    name: 'SLPK Slice',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '5939ac85cf48455ba87d450cf178fae1',
  },
  {
    assetId: 'uuid-10',
    name: 'Tree',
    description: null,
    fileType: 'POINT',
    status: 'APPROVED',
    arcGisId: 'b19f27b6b03242cfa9cc3a70faca5e6c',
  },
  {
    assetId: 'uuid-11',
    name: 'Building',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '6682d21b538c4de1a7dd42b8b0bd38fd',
  },
  {
    assetId: 'uuid-12',
    name: 'Civil Engineering Building',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'f53b7144403e4f0fba06b9d28eae65e0',
  },
  {
    assetId: 'uuid-13',
    name: 'Library and Information Center',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'd0f460e48724475092fbfa69cc1c32a8',
  },
  {
    assetId: 'uuid-14',
    name: 'Aerial Survey Museum',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '69599d560b2d43c68680af49afe28a05',
  },
  {
    assetId: 'uuid-15',
    name: 'Fisheries Museum',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'b25a438d9e444ba289aef7b2534f8eba',
  },
  {
    assetId: 'uuid-16',
    name: 'Mathematics Library',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'e434a4f6513d488b996089a0b308386e',
  },
  {
    assetId: 'uuid-17',
    name: 'Master Map',
    description: null,
    fileType: 'POINT',
    status: 'APPROVED',
    arcGisId: '6fdd8f3ef600442e8f11b52a11ac0e94',
  },
  {
    assetId: 'uuid-18',
    name: 'Main Library',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '42495384ef374acc9a1425c111752165',
  },
  {
    assetId: 'uuid-19',
    name: 'Old Mathematics Building',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '58a2635b9ae14d3b9b51c7cb534704c5',
  },
  {
    assetId: 'uuid-20',
    name: 'Institute of Biochemical Sciences',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'aedcfb22d3744dc8ae83ba6f1828d0a3',
  },
  {
    assetId: 'uuid-21',
    name: 'Electrical Engineering Hall 1',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'e30b53ac08844831aa20ebf4c206a059',
  },
  {
    assetId: 'uuid-22',
    name: 'Independent bookstores',
    description: null,
    fileType: 'ATTRIBUTE',
    status: 'APPROVED',
    arcGisId: 'df90166ab68a4567a46907720f7e769a',
  },
  {
    assetId: 'uuid-23',
    name: 'Dihua Street North',
    description: null,
    fileType: 'ATTRIBUTE',
    status: 'APPROVED',
    arcGisId: '94981ebab3de49dc8832e7050135dca4',
  },
  {
    assetId: 'uuid-24',
    name: 'Forest Department Building',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '4feec794c52d491fb297d200e96a475a',
  },
  {
    assetId: 'uuid-25',
    name: 'Original branch',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'f36b7830b35c4508b6f5ab87944c1b74',
  },
  {
    assetId: 'uuid-26',
    name: 'First Student Activity Center',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '384793baedc7451e9df0e56cbf278cea',
  },
  {
    assetId: 'uuid-27',
    name: 'Freshman Teaching Building',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '102c5c2c93284c7aa0cf89c0f4092fd7',
  },
  {
    assetId: 'uuid-28',
    name: 'Chemical Industry Museum',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'b46ad826ed8a4de0b04435ca0ba41a05',
  },
  {
    assetId: 'uuid-29',
    name: 'Wenyan Building',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '928e63861412457fbf77de2d36c0f831',
  },
  {
    assetId: 'uuid-30',
    name: 'Hall 3',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'eb00ba3f538c49b0867a77a95e21650b',
  },
  {
    assetId: 'uuid-31',
    name: "Girls' Dormitory 9",
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '14901e2128954e45b6e6695cc578c65c',
  },
  {
    assetId: 'uuid-32',
    name: 'Flower Pavilion',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '2624c2728e08497bb5c6275b618f2390',
  },
  {
    assetId: 'uuid-33',
    name: 'Mathematics Museum',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '0ea241be89ea4ab6bec9354410a2a86b',
  },
  {
    assetId: 'uuid-34',
    name: 'Hall 5',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '33b31888a610404eb0a038e75104ff32',
  },
  {
    assetId: 'uuid-35',
    name: '2D Map- Key Facilities',
    description: null,
    fileType: 'ATTRIBUTE',
    status: 'APPROVED',
    arcGisId: '7fc51c22437e40c4ae9a6e2a7d32b607',
  },
  {
    assetId: 'uuid-36',
    name: 'Electrical Engineering Hall 1',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '6c37c4cf5dbc4aba99ae4b4869fd5d6a',
  },
  {
    assetId: 'uuid-37',
    name: 'Siliang Pavilion',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '153c469ebad14a75b0855015e36015b8',
  },
  {
    assetId: 'uuid-38',
    name: "Women's Dormitory 9 Restaurant",
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'f6250186782b490a8cc16d7b38c54b07',
  },
  {
    assetId: 'uuid-39',
    name: 'Siliang Pavilion',
    description: null,
    fileType: 'ATTRIBUTE',
    status: 'APPROVED',
    arcGisId: '671972e16233433b9553e23f6d71774e',
  },
  {
    assetId: 'uuid-40',
    name: 'Forest Products Hall',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'de0a51b8ad394cb78a3174c1e3c3ef7a',
  },
  {
    assetId: 'uuid-41',
    name: "Women's Dormitory 8",
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '84d8a390dff9409e8e1078eea7bedf4c',
  },
  {
    assetId: 'uuid-42',
    name: 'Health Center',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '8341b5d264bf4ae2aee5099d736483eb',
  },
  {
    assetId: 'uuid-43',
    name: 'Mathematical Research Center',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '058615b3b5c84f1093865b460df208f2',
  },
  {
    assetId: 'uuid-44',
    name: 'Hall 1',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: 'acde1850ad244e82a5f392e9aa5456f3',
  },
  {
    assetId: 'uuid-45',
    name: 'Comprehensive Teaching Building',
    description: null,
    fileType: 'SHAPE',
    status: 'APPROVED',
    arcGisId: '5dacb606258840428df745a5cf1bf990',
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. CLEANUP: Delete in reverse order of dependency (Children -> Parents)
  // This prevents Foreign Key constraint errors during cleanup
  await prisma.annotation.deleteMany();
  await prisma.scene.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.notification.deleteMany();
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

  // 2. Create 4 Users (3 Approved, 1 Pending)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'user1@example.com',
        password: userPassword,
        fullName: 'Owner User 1',
        role: 'USER',
        accountStatus: 'APPROVED',
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user2@example.com',
        password: userPassword,
        fullName: 'Owner User 2',
        role: 'USER',
        accountStatus: 'APPROVED',
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user3@example.com',
        password: userPassword,
        fullName: 'Owner User 3',
        role: 'USER',
        accountStatus: 'APPROVED',
        isEmailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'pending@example.com',
        password: userPassword,
        fullName: 'New Applicant',
        role: 'USER',
        accountStatus: 'PENDING',
        isEmailVerified: true,
      },
    }),
  ]);

  console.log(`✅ ${users.length} User Created }`);

  // 3. PASS 1: Create SHAPE Assets (Parents)
  const shapeAssetMap = new Map<string, string>();

  const shapeAssets = MOCK_ASSETS.filter((a) => a.fileType === 'SHAPE');

  for (let i = 0; i < shapeAssets.length; i++) {
    const asset = shapeAssets[i];
    const owner = users[i % 3];

    const created = await prisma.asset.create({
      data: {
        ownerId: owner.id,
        name: asset.name,
        description: asset.description || 'Architectural BIM model',
        fileUrl: `/uploads/${asset.assetId}.rvt`,
        fileType: 'SHAPE',
        status: asset.status as any, // Ensure this matches your Enum values exactly
        arcgisItemId: asset.arcGisId,
        metadata: { layers: ['Walls', 'Roof', 'Foundation'] }, // Mock JSON
      },
    });

    shapeAssetMap.set(asset.name, created.id);
  }
  console.log(`✅ Created ${shapeAssetMap.size} SHAPE assets.`);

  // 4. PASS 2: Create ATTRIBUTE Assets (Children)
  const attributeAssets = MOCK_ASSETS.filter((a) => a.fileType === 'ATTRIBUTE');

  for (let i = 0; i < attributeAssets.length; i++) {
    const asset = attributeAssets[i];
    const owner = users[i % 3];

    // Bind to parent if a name match exists
    const bindId = shapeAssetMap.get(asset.name.replace(' Sensor', '').replace(' Map', '')) || null;

    await prisma.asset.create({
      data: {
        ownerId: owner.id,
        name: asset.name,
        description: asset.description || 'Tabular data',
        fileUrl: `/uploads/${asset.assetId}.xlsx`,
        fileType: 'ATTRIBUTE',
        status: asset.status as any,
        arcgisItemId: asset.arcGisId,
        bindToShapeId: bindId, // Recursive relation
        metadata: { xCol: 'Lat', yCol: 'Long' }, // Mock JSON
      },
    });
  }
  console.log(`✅ Created ${attributeAssets.length} ATTRIBUTE assets.`);

  // 5. Mock Scene
  await prisma.scene.create({
    data: {
      authorId: users[0].id,
      name: 'Initial Inspection',
      cameraState: { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 } },
      layerVisibility: { 'all': true }
    }
  });

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
