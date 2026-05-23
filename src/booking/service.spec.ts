import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { Service } from './service.js';
import { MemoryStore } from './memory-store.js';

describe('Concurrent booking', () => {
  it('exactly one wins', async () => {
    const store = new MemoryStore();
    const service = new Service(store);

    const concurrency = 10_000; // trying to booking a seat

    let success = 0;
    let failure = 0;

    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        try {
          await service.book({
            id: randomUUID(),
            movieId: 'screen-1',
            seatId: 'A1',
            userId: randomUUID(),
            status: 'CONFIRMED',
          });
          success++;
        } catch {
          failure++;
        }
      })
    );

    expect(success).toBe(1);
    expect(failure).toBe(concurrency - 1);
  });
});
