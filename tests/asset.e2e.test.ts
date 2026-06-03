import request from 'supertest';
import app from '../src/app'; 
import { prisma } from '../src/common/configs/prisma';

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
    email: 'user@example.com',
    password: 'User@123',
  });
  userToken = userRes.body.data.accessToken;
});

afterAll(async () => {
  // Clean up the uploaded asset from the DB
  if (uploadedShapeId) {
    await prisma.asset.deleteMany({ where: { id: uploadedShapeId } });
  }
  await prisma.$disconnect();
});

describe('Asset Module E2E', () => {
  it('1. [POST] /api/v1/assets - Should reject invalid file extensions', async () => {
    // Change this to mock Excel data and an .xlsx extension
    const mockXlsxBuffer = Buffer.from('mock excel data');

    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${userToken}`)
      .field('name', 'Bad Upload')
      .field('fileType', 'SHAPE')
      .attach('file', mockXlsxBuffer, 'hacked.xlsx'); // <-- Changed to .xlsx

    expect(res.status).toBe(400);
    expect(res.body.meta.message).toContain('.rvt, .ifc, or .zip');
  });

  it('2. [POST] /api/v1/assets - Should upload a valid SHAPE asset', async () => {
    const mockRvtBuffer = Buffer.from('mock rvt binary data');

    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${userToken}`)
      .field('name', 'My New Building')
      .field('fileType', 'SHAPE')
      .attach('file', mockRvtBuffer, 'building.rvt'); // Valid extension

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    
    uploadedShapeId = res.body.data.id; // Save ID for later tests
  });

  it('3. [PATCH] /api/v1/assets/:id - User should update their asset metadata', async () => {
    const res = await request(app)
      .patch(`/api/v1/assets/${uploadedShapeId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated Building Name' }); // Sent as JSON

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Building Name');
  });

  it('4. [PATCH] /api/v1/assets/:id/status - Admin should approve the asset', async () => {
    const res = await request(app)
      .patch(`/api/v1/assets/${uploadedShapeId}/status`)
      .set('Authorization', `Bearer ${adminToken}`) // Only Admin can do this
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('5. [GET] /api/v1/assets - Should fetch user assets', async () => {
    const res = await request(app)
      .get('/api/v1/assets')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});