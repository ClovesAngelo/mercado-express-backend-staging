import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E tests for critical API flows.
 * Each test creates its own data - no dependency on global seeds.
 * 
 * Limitations:
 * - Requires a running database (DATABASE_URL in .env)
 * - Tests are sequential and may be affected by previous test data
 * - Some flows depend on the database state (e.g., unique email constraints)
 */
describe('Mercado Express - E2E Tests', () => {
  let app: INestApplication;
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  const testPassword = 'Test@123456';
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Auth Flow', () => {
    it('POST /auth/register should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          name: 'E2E Test User',
          password: testPassword,
          role: 'CLIENTE',
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user).not.toHaveProperty('password');
      accessToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('POST /auth/login should authenticate with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('POST /auth/login should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('POST /auth/login should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent-' + Date.now() + '@example.com',
          password: testPassword,
        })
        .expect(401);
    });
  });

  describe('Markets Flow', () => {
    let marketId: string;

    it('GET /markets should return markets list', async () => {
      const response = await request(app.getHttpServer())
        .get('/markets')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /markets should create a market (requires auth)', async () => {
      // This may fail if the user doesn't have admin role
      // We test the endpoint exists and requires auth
      await request(app.getHttpServer())
        .post('/markets')
        .send({
          name: 'E2E Test Market',
          address: '123 E2E Street',
          description: 'Created during E2E test',
          phone: '11999999999',
        })
        .expect(401); // Unauthorized without token
    });

    it('POST /markets should create a market with admin token', async () => {
      // First register as admin
      const adminEmail = `admin-e2e-${Date.now()}@example.com`;
      const adminResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: adminEmail,
          name: 'Admin E2E',
          password: testPassword,
          role: 'ADMIN_GERAL',
        })
        .expect(201);

      const adminToken = adminResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .post('/markets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Market',
          address: '123 E2E Street',
          description: 'Created during E2E test',
          phone: '11999999999',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('E2E Test Market');
      marketId = response.body.id;
    });
  });

  describe('Catalog Flow', () => {
    it('GET /catalog/products should return products list', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /catalog/categories should return categories list', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});