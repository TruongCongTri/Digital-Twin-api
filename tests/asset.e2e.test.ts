import request from 'supertest';
import app from '../src/app'; 
import { prisma } from '../src/common/configs/prisma';

// Import Redis and Queue/Worker to close them after tests
import { redisConnection } from '../src/common/configs/redis.config';
import { assetSyncQueue, assetSyncWorker } from '../src/modules/asset/asset.worker';

let adminToken = '';
let userToken = '';
let uploadedShapeId = '';

beforeAll(async () => {
  await prisma.$connect();

  // 1. Get Admin Token
  const adminRes = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@digitaltwin.com',
    password: 'Admin@123',
  });
  adminToken = adminRes.body.data.accessToken;

  // 2. Get Standard User Token
  const userRes = await request(app).post('/api/v1/auth/login').send({
    email: 'user1@example.com',
    password: 'User@123',
  });
  userToken = userRes.body.data.accessToken;
});

afterAll(async () => {
  // 1. Clean up the uploaded asset from the DB
  if (uploadedShapeId) {
    await prisma.asset.deleteMany({ where: { id: uploadedShapeId } });
  }
  await prisma.$disconnect();

  // 2. Clean up BullMQ and Redis connections so Jest exits cleanly!
  await assetSyncWorker.close();
  await assetSyncQueue.close();
  redisConnection.quit();
});

describe('Asset Module E2E', () => {
  it('1. [POST] /api/v1/assets - Should reject invalid file extensions', async () => {
    const mockXlsxBuffer = Buffer.from('mock excel data');

    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${userToken}`)
      .field('name', 'Bad Upload')
      .field('fileType', 'SHAPE')
      .attach('file', mockXlsxBuffer, 'hacked.xlsx'); // Wrong extension for SHAPE

    // Fix: We only check the HTTP status code. 
    // Error payloads usually don't use the standard { meta: {} } success wrapper.
    expect(res.status).toBe(400);
  });

  it('2. [POST] /api/v1/assets - Should upload and auto-queue sync for a valid SHAPE asset', async () => {
    const mockRvtBuffer = Buffer.from('mock rvt binary data');

    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${userToken}`)
      .field('name', 'My New Building')
      .field('fileType', 'SHAPE')
      .attach('file', mockRvtBuffer, 'building.rvt'); // Valid extension

    expect(res.status).toBe(201);
    
    // Check Map Visibility Status
    expect(res.body.data.status).toBe('PENDING');
    
    // Check ArcGIS Sync Background Job Status
    expect(res.body.data.syncStatus).toBe('PENDING');
    expect(res.body.data.syncProgress).toBe(0);
    
    uploadedShapeId = res.body.data.id; // Save ID for later tests
  });

  it('3. [PATCH] /api/v1/assets/:id - User should update their asset metadata', async () => {
    const res = await request(app)
      .patch(`/api/v1/assets/${uploadedShapeId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated Building Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Building Name');
  });

  it('4. [PATCH] /api/v1/assets/:id/status - Admin should approve the asset for public map visibility', async () => {
    const res = await request(app)
      .patch(`/api/v1/assets/${uploadedShapeId}/status`)
      .set('Authorization', `Bearer ${adminToken}`) // Only Admin can do this
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('5. [GET] /api/v1/assets - Should fetch user-owned assets', async () => {
    const res = await request(app)
      .get('/api/v1/assets')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('6. [GET] /api/v1/assets/public - Should fetch only APPROVED public assets without requiring a token', async () => {
    const res = await request(app)
      .get('/api/v1/assets/public'); // No token provided!

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    // Verify that the route successfully forced the status constraint
    res.body.data.forEach((asset: any) => {
      expect(asset.status).toBe('APPROVED');
    });
  });
});