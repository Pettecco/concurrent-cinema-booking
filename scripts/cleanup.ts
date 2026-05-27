import { db } from '../src/infra/postgres/client.js';
import { redis } from '../src/infra/redis/client.js';

async function cleanup() {
  try {
    await db('bookings').del();

    const keys = await redis.keys('lock:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`${keys.length} locks removidos do Redis`);
    }
  } catch (error) {
    console.error('Erro no cleanup:', error);
    process.exit(1);
  } finally {
    await db.destroy();
    await redis.quit();
  }
}

cleanup();
