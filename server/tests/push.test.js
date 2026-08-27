import { describe, it, expect } from 'vitest';
import { request, app, authHeaders, loginAs } from './helpers.js';

describe('Push notifications', () => {
  const base = '/api/push';

  it('exposes the public VAPID key without auth', async () => {
    const res = await request(app).get(`${base}/vapid-public-key`);
    expect(res.status).toBe(200);
    expect(typeof res.body.publicKey).toBe('string');
  });

  it('returns the VAPID public key', async () => {
    const res = await request(app)
      .get(`${base}/vapid-public-key`)
      .set(authHeaders('user', 2));
    expect(res.status).toBe(200);
    expect(typeof res.body.publicKey).toBe('string');
  });

  it('reads, updates and unsubscribes preferences', async () => {
    const user = await loginAs('user');
    const get = await user.get(`${base}/preferences`);
    expect(get.status).toBe(200);

    const upd = await user.patch(`${base}/preferences`).send({ enabled: false });
    expect(upd.status).toBe(200);
    expect(upd.body.enabled).toBe(false);
  });

  it('subscribes a device and can send a test push', async () => {
    const user = await loginAs('user');
    const sub = await user
      .post(`${base}/subscribe`)
      .send({
        endpoint: 'https://push.example.com/abc',
        keys: { p256dh: 'k1', auth: 'k2' },
      });
    expect(sub.status).toBe(201);

    const test = await user.post(`${base}/test`);
    expect(test.status).toBe(200);

    const unsub = await user
      .post(`${base}/unsubscribe`)
      .send({ endpoint: 'https://push.example.com/abc' });
    expect(unsub.status).toBe(200);
  });

  it('restricts broadcast endpoints to admins', async () => {
    const user = await loginAs('user');
    await user
      .post(`${base}/subscribe`)
      .send({ endpoint: 'https://push.example.com/abc', keys: { p256dh: 'k1', auth: 'k2' } });
    expect((await user.post(`${base}/send-all`).send({ title: 'x', body: 'y' })).status).toBe(
      403
    );
    const admin = await loginAs('admin');
    expect(
      (await admin.post(`${base}/send-all`).send({ title: 'x', body: 'y' })).status
    ).toBe(200);
  });
});
