import request from 'supertest';
import app from '../src/app'; // Your express app without app.listen
import { prisma } from '../src/common/configs/prisma';

// Setup & Teardown
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'test_register@example.com' } });
  await prisma.$disconnect();
});

describe('Auth Module E2E', () => {
  let userToken = '';

  it('1. [POST] /api/v1/auth/register - Should register a new user (Status: PENDING)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test_register@example.com',
      password: 'Password@123',
      fullName: 'Test User',
    });

    expect(res.status).toBe(201);
    expect(res.body.meta.success).toBe(true);
    expect(res.body.data.accountStatus).toBe('PENDING');
  });

  it('2. [POST] /api/v1/auth/login - Should block login for PENDING user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test_register@example.com',
      password: 'Password@123',
    });

    expect(res.status).toBe(403);
    expect(res.body.meta.message).toContain('pending');
  });

  it('3. [POST] /api/v1/auth/login - Should login APPROVED Admin successfully', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@digitaltwin.com', // Created by seed
      password: 'Admin@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    
    // Save token for next tests
    userToken = res.body.data.accessToken; 
  });

  it('4. [GET] /api/v1/users/applicants - Admin should fetch pending users', async () => {
    const res = await request(app)
      .get('/api/v1/users/applicants?status=PENDING')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});