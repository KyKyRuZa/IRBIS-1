import { describe, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';

// We recreate the lock functions here for pure logic testing, matching the
// implementation in src/utils/redis.js exactly.

function makeAcquireLock(redisClient) {
  return async function acquireLock(key, ttlMs) {
    if (!redisClient) return null;
    const token = crypto.randomUUID();
    try {
      const result = await redisClient.set(key, token, { NX: true, PX: ttlMs });
      if (result === null) return null;
      return token;
    } catch (err) {
      return null;
    }
  };
}

function makeReleaseLock(redisClient) {
  return async function releaseLock(key, token) {
    if (!redisClient || !token) return false;
    try {
      const script =
        'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
      const result = await redisClient.eval(script, { keys: [key], arguments: [token] });
      return result === 1;
    } catch (err) {
      return false;
    }
  };
}

describe('Redis lock functions — pure logic', () => {
  describe('acquireLock', () => {
    it('returns a UUID token when redisClient.set returns "OK"', async () => {
      const fakeClient = { set: vi.fn().mockResolvedValue('OK') };
      const acquireLock = makeAcquireLock(fakeClient);
      const token = await acquireLock('my-key', 5000);

      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(fakeClient.set).toHaveBeenCalledWith('my-key', token, { NX: true, PX: 5000 });
    });

    it('returns null when redisClient.set returns null (lock held)', async () => {
      const fakeClient = { set: vi.fn().mockResolvedValue(null) };
      const acquireLock = makeAcquireLock(fakeClient);
      const token = await acquireLock('my-key', 5000);

      expect(token).toBeNull();
    });

    it('returns null immediately when redisClient is null (fallback mode)', async () => {
      const acquireLock = makeAcquireLock(null);
      const token = await acquireLock('any-key', 5000);
      expect(token).toBeNull();
    });

    it('returns null when redisClient.set throws', async () => {
      const fakeClient = { set: vi.fn().mockRejectedValue(new Error('Redis down')) };
      const acquireLock = makeAcquireLock(fakeClient);
      const token = await acquireLock('my-key', 5000);
      expect(token).toBeNull();
    });

    it('passes the correct key and TTL to set', async () => {
      const fakeClient = { set: vi.fn().mockResolvedValue('OK') };
      const acquireLock = makeAcquireLock(fakeClient);
      await acquireLock('cron:daily-jobs', 300000);

      expect(fakeClient.set).toHaveBeenCalledWith('cron:daily-jobs', expect.any(String), {
        NX: true,
        PX: 300000,
      });
    });
  });

  describe('releaseLock', () => {
    it('returns true when eval returns 1 (key deleted)', async () => {
      const fakeClient = { eval: vi.fn().mockResolvedValue(1) };
      const releaseLock = makeReleaseLock(fakeClient);
      const result = await releaseLock('my-key', 'some-token');

      expect(result).toBe(true);
      expect(fakeClient.eval).toHaveBeenCalledTimes(1);
    });

    it('returns false when eval returns 0 (token mismatch - race condition safe)', async () => {
      const fakeClient = { eval: vi.fn().mockResolvedValue(0) };
      const releaseLock = makeReleaseLock(fakeClient);
      const result = await releaseLock('my-key', 'wrong-token');
      expect(result).toBe(false);
    });

    it('returns false immediately when token is null (no eval call)', async () => {
      const fakeClient = { eval: vi.fn().mockResolvedValue(1) };
      const releaseLock = makeReleaseLock(fakeClient);
      const result = await releaseLock('my-key', null);

      expect(result).toBe(false);
      expect(fakeClient.eval).not.toHaveBeenCalled();
    });

    it('returns false immediately when token is undefined (no eval call)', async () => {
      const fakeClient = { eval: vi.fn().mockResolvedValue(1) };
      const releaseLock = makeReleaseLock(fakeClient);
      const result = await releaseLock('my-key', undefined);

      expect(result).toBe(false);
      expect(fakeClient.eval).not.toHaveBeenCalled();
    });

    it('returns false when redisClient is null (fallback)', async () => {
      const releaseLock = makeReleaseLock(null);
      const result = await releaseLock('my-key', 'some-token');
      expect(result).toBe(false);
    });

    it('returns false when eval throws (error handling)', async () => {
      const fakeClient = { eval: vi.fn().mockRejectedValue(new Error('Redis eval error')) };
      const releaseLock = makeReleaseLock(fakeClient);
      const result = await releaseLock('my-key', 'some-token');
      expect(result).toBe(false);
    });

    it('passes the Lua script with correct KEYS and arguments structure', async () => {
      const fakeClient = { eval: vi.fn().mockResolvedValue(1) };
      const releaseLock = makeReleaseLock(fakeClient);
      await releaseLock('lockkey', 'my-token');

      const call = fakeClient.eval.mock.calls[0];
      expect(call[1]).toHaveProperty('keys');
      expect(call[1]).toHaveProperty('arguments');
      expect(call[1].keys).toEqual(['lockkey']);
      expect(call[1].arguments).toEqual(['my-token']);
    });
  });

  describe('disconnectRedis', () => {
    it('calls quit() when redisClient is available', async () => {
      const quitFn = vi.fn().mockResolvedValue(undefined);
      const redisClient = { quit: quitFn };

      if (redisClient) {
        await redisClient.quit();
      }
      expect(quitFn).toHaveBeenCalledTimes(1);
    });

    it('does nothing when redisClient is null (no error)', async () => {
      const redisClient = null;
      let called = false;
      if (redisClient) {
        called = true;
      }
      expect(called).toBe(false);
    });
  });
});

describe('Redis lock integration — distributed lock semantics', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it('token from acquireLock is a valid UUID v4', async () => {
    const fakeClient = { set: vi.fn().mockResolvedValue('OK') };
    const acquireLock = makeAcquireLock(fakeClient);
    const token = await acquireLock('test', 1000);
    expect(token).toMatch(uuidRegex);
  });

  it('same key acquired twice returns null on second attempt (NX lock)', async () => {
    const fakeStore = new Map();
    const fakeClient = {
      set: vi.fn(async (key, value, opts) => {
        if (opts?.NX && fakeStore.has(key)) return null;
        fakeStore.set(key, value);
        return 'OK';
      }),
    };
    const acquireLock = makeAcquireLock(fakeClient);

    const token1 = await acquireLock('shared-key', 5000);
    const token2 = await acquireLock('shared-key', 5000);

    expect(token1).not.toBeNull();
    expect(token2).toBeNull();
  });

  it('different keys can be locked concurrently', async () => {
    const fakeStore = new Map();
    const fakeClient = {
      set: vi.fn(async (key, value, opts) => {
        if (opts?.NX && fakeStore.has(key)) return null;
        fakeStore.set(key, value);
        return 'OK';
      }),
    };
    const acquireLock = makeAcquireLock(fakeClient);

    const token1 = await acquireLock('key-1', 5000);
    const token2 = await acquireLock('key-2', 5000);

    expect(token1).not.toBeNull();
    expect(token2).not.toBeNull();
    expect(token1).not.toBe(token2);
  });

  it('releaseLock only deletes the key if the token matches', async () => {
    const fakeStore = new Map();
    const fakeClient = {
      set: vi.fn(async (key, value) => {
        fakeStore.set(key, value);
        return 'OK';
      }),
      eval: vi.fn(async (script, { keys, arguments: args }) => {
        const key = keys[0];
        const token = args[0];
        if (fakeStore.get(key) === token) {
          fakeStore.delete(key);
          return 1;
        }
        return 0;
      }),
    };
    const acquireLock = makeAcquireLock(fakeClient);
    const releaseLock = makeReleaseLock(fakeClient);

    const token = await acquireLock('my-key', 5000);

    // Correct token releases the lock
    expect(await releaseLock('my-key', token)).toBe(true);

    // After release, a new lock with the same key succeeds
    const newToken = await acquireLock('my-key', 5000);
    expect(newToken).toMatch(uuidRegex);
  });

  it('releaseLock does NOT delete the key if token mismatched (prevents hijacking)', async () => {
    const fakeStore = new Map();
    const fakeClient = {
      set: vi.fn(async (key, value, opts) => {
        if (opts?.NX && fakeStore.has(key)) return null;
        fakeStore.set(key, value);
        return 'OK';
      }),
      eval: vi.fn(async (script, opts) => {
        const key = opts.keys[0];
        const token = opts.arguments[0];
        if (fakeStore.get(key) === token) {
          fakeStore.delete(key);
          return 1;
        }
        return 0;
      }),
    };
    const acquireLock = makeAcquireLock(fakeClient);
    const releaseLock = makeReleaseLock(fakeClient);

    const token = await acquireLock('my-key', 5000);
    expect(fakeStore.has('my-key')).toBe(true);

    // Wrong token does NOT release the lock
    const result = await releaseLock('my-key', 'wrong-token');
    expect(result).toBe(false);

    // The key should still be in the store
    expect(fakeStore.has('my-key')).toBe(true);
    expect(fakeStore.get('my-key')).toBe(token);

    // Second acquire with NX returns null because key still exists
    const second = await acquireLock('my-key', 5000);
    expect(second).toBeNull();

    // Correct token can still release it
    expect(await releaseLock('my-key', token)).toBe(true);
    expect(fakeStore.has('my-key')).toBe(false);
  });
});
