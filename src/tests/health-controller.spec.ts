import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthController } from '../infra/http/health-controller.js';

function makeReq() {
  return {} as import('express').Request;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as import('express').Response & typeof res;
}

function makeMockDB(shouldSucceed: boolean) {
  return {
    raw: vi.fn().mockImplementation(async () => {
      if (!shouldSucceed) throw new Error('DB connection failed');
      return [{ '': 1 }];
    }),
  } as unknown as import('knex').Knex;
}

function makeMockRedis(shouldSucceed: boolean) {
  return {
    ping: vi.fn().mockImplementation(async () => {
      if (!shouldSucceed) throw new Error('Redis connection failed');
      return 'PONG';
    }),
  } as unknown as import('ioredis').Redis;
}

describe('HealthController', () => {
  it('returns 200 when both DB and Redis are up', async () => {
    const db = makeMockDB(true);
    const redis = makeMockRedis(true);
    const controller = new HealthController(db, redis);

    const res = makeRes();
    await controller.check(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'ok',
      checks: {
        postgres: { status: 'ok' },
        redis: { status: 'ok' },
      },
    });
  });

  it('returns 503 when DB is down', async () => {
    const db = makeMockDB(false);
    const redis = makeMockRedis(true);
    const controller = new HealthController(db, redis);

    const res = makeRes();
    await controller.check(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0]![0];
    expect(body.status).toBe('error');
    expect(body.checks.postgres.status).toBe('error');
    expect(body.checks.postgres.error).toBe('DB connection failed');
    expect(body.checks.redis.status).toBe('ok');
  });

  it('returns 503 when Redis is down', async () => {
    const db = makeMockDB(true);
    const redis = makeMockRedis(false);
    const controller = new HealthController(db, redis);

    const res = makeRes();
    await controller.check(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0]![0];
    expect(body.status).toBe('error');
    expect(body.checks.redis.status).toBe('error');
    expect(body.checks.redis.error).toBe('Redis connection failed');
    expect(body.checks.postgres.status).toBe('ok');
  });

  it('returns 503 when both are down', async () => {
    const db = makeMockDB(false);
    const redis = makeMockRedis(false);
    const controller = new HealthController(db, redis);

    const res = makeRes();
    await controller.check(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' })
    );
  });
});
