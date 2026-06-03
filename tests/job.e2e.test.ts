import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/common/configs/prisma';

// 🚨 MOCK BULLMQ: Prevent real Redis connections during tests
jest.mock('../src/modules/job/job.worker', () => ({
  publishQueue: {
    add: jest.fn().mockResolvedValue(true), // Pretend the job was queued successfully
  },
}));

let adminToken = '';
let userToken = '';
let targetAssetId = '';

beforeAll(async () => {
  await prisma.$connect();

  // 1. Get Admin Token
  const adminRes = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@digitaltwin.com',
    password: 'Admin@123',
  });
  adminToken = adminRes.body.data.accessToken;

  // 2. Get User Token
  const userRes = await request(app).post('/api/v1/auth/login').send({
    email: 'user@example.com',
    password: 'User@123',
  });
  userToken = userRes.body.data.accessToken;

  // 3. Create a fresh APPROVED asset for testing the publish flow
  const newAsset = await prisma.asset.create({
    data: {
      ownerId: adminRes.body.data.user.id,
      name: 'Test Publish Building',
      fileType: 'SHAPE',
      fileUrl: '/uploads/test.rvt',
      status: 'APPROVED',
    },
  });
  targetAssetId = newAsset.id;
});

afterAll(async () => {
  if (targetAssetId) {
    await prisma.asset.deleteMany({ where: { id: targetAssetId } });
  }
  await prisma.$disconnect();
});

describe('Publish Job Module E2E', () => {
  it('1. [POST] /api/v1/jobs/publish/:id - Non-Admins should be blocked', async () => {
    const res = await request(app)
      .post(`/api/v1/jobs/publish/${targetAssetId}`)
      .set('Authorization', `Bearer ${userToken}`); 

    expect(res.status).toBe(403);
    expect(res.body.meta.message).toContain('permission'); 
  });

  it('2. [POST] /api/v1/jobs/publish/:id - Admin triggers job successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/jobs/publish/${targetAssetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(202); // 202 Accepted
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.progress).toBe(0);
  });

  it('3. [POST] /api/v1/jobs/publish/:id - Prevents race conditions (Duplicate queues)', async () => {
    // Firing it again immediately should fail because it's already PENDING
    const res = await request(app)
      .post(`/api/v1/jobs/publish/${targetAssetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409); // Conflict
    expect(res.body.meta.message).toContain('already queued or processing');
  });

  it('4. [GET] /api/v1/jobs/publish/:id - Any authenticated user can poll status', async () => {
    const res = await request(app)
      .get(`/api/v1/jobs/publish/${targetAssetId}`)
      .set('Authorization', `Bearer ${userToken}`); // Standard users can view progress

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PENDING');
  });
});