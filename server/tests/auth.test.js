import { describe, it, expect, beforeEach } from 'vitest';
import {
  loginAs,
  request,
  app,
  authHeaders,
  resetDatabase,
} from './helpers.js';

describe('Auth', () => {
  beforeEach(resetDatabase);

  describe('POST /api/auth/login', () => {
    it('validates required fields', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('rejects unknown user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'ghost', password: 'whatever' });
      expect(res.status).toBe(401);
    });

    it('rejects wrong password', async () => {
      await loginAs('admin'); // ensure admin exists
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('logs in and returns the public user', async () => {
      const agent = await loginAs('admin');
      const res = await agent.get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('admin');
      expect(res.body.role).toBe('admin');
      expect(res.body.password_hash).toBeUndefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns the current user for a valid token', async () => {
      const agent = await loginAs('admin');
      const res = await agent.get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('admin');
    });
  });

  describe('POST /api/auth/register', () => {
    it('creates the first admin when the database is empty', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'firstadmin', password: 'secret' });
      expect(res.status).toBe(201);
      expect(res.body.role).toBe('admin');
    });

    it('rejects registration without a token when users already exist', async () => {
      await loginAs('admin');
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'second', password: 'secret' });
      expect(res.status).toBe(401);
    });

    it('rejects registration by a non-admin user', async () => {
      await loginAs('admin');
      const user = await loginAs('user');
      const res = await user
        .post('/api/auth/register')
        .send({ username: 'third', password: 'secret' });
      expect(res.status).toBe(403);
    });

    it('validates required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'onlyuser' });
      expect(res.status).toBe(400);
    });

    it('rejects duplicate username', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ username: 'dup', password: 'secret' });
      expect(res1.status).toBe(201);
      // DB now has a user, so open registration is blocked; use admin token
      const admin = await loginAs('admin');
      const res2 = await admin
        .post('/api/auth/register')
        .send({ username: 'dup', password: 'secret' });
      expect(res2.status).toBe(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({ old_password: 'a', new_password: 'b' });
      expect(res.status).toBe(401);
    });

    it('rejects an incorrect old password', async () => {
      const agent = await loginAs('admin');
      const res = await agent
        .post('/api/auth/change-password')
        .send({ old_password: 'nope', new_password: 'newpass1' });
      expect(res.status).toBe(401);
    });

    it('changes the password and allows login with the new one', async () => {
      const agent = await loginAs('admin');
      const res = await agent
        .post('/api/auth/change-password')
        .send({ old_password: 'adminpass', new_password: 'newpass1' });
      expect(res.status).toBe(200);
      const login = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'newpass1' });
      expect(login.status).toBe(200);
    });
  });

  describe('POST /api/auth/refresh & logout', () => {
    it('rejects refresh without a cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('refreshes an active session', async () => {
      const agent = await loginAs('admin');
      const res = await agent.post('/api/auth/refresh');
      expect(res.status).toBe(200);
    });

    it('logs out', async () => {
      const agent = await loginAs('admin');
      const res = await agent.post('/api/auth/logout');
      expect(res.status).toBe(200);
    });

    it('accepts a bearer token (alternative to cookie)', async () => {
      await loginAs('admin');
      const res = await request(app)
        .get('/api/auth/me')
        .set(authHeaders('admin', 1));
      expect(res.status).toBe(200);
    });
  });
});
