import { createClient } from 'redis';
import knex from 'knex';
import knexConfig from '../knexfile.js';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

async function cleanup() {
  console.log('Starting cleanup...\n');

  // Cleanup PostgreSQL
  console.log('Cleaning PostgreSQL...');
  const db = knex(knexConfig);

  try {
    await db.transaction(async trx => {
      await trx.raw('TRUNCATE TABLE bookings RESTART IDENTITY CASCADE');
      await trx.raw('TRUNCATE TABLE showtimes RESTART IDENTITY CASCADE');
      await trx.raw('TRUNCATE TABLE rooms RESTART IDENTITY CASCADE');
      await trx.raw('TRUNCATE TABLE movies RESTART IDENTITY CASCADE');
    });
  } catch (error) {
  } finally {
    await db.destroy();
  }

  // Cleanup Redis
  console.log('\nCleaning Redis...');
  const redis = createClient({
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
  });

  try {
    await redis.connect();

    const keys = await redis.keys('lock:*');
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Deleted ${keys.length} lock key(s)`);
    } else {
      console.log('No lock keys to delete');
    }

    const queueKeys = await redis.keys('bull:*');
    if (queueKeys.length > 0) {
      await redis.del(queueKeys);
      console.log(`Deleted ${queueKeys.length} queue key(s)`);
    } else {
      console.log('No queue keys to delete');
    }

    const sessionKeys = await redis.keys('session:*');
    if (sessionKeys.length > 0) {
      await redis.del(sessionKeys);
      console.log(`Deleted ${sessionKeys.length} session key(s)`);
    } else {
      console.log('No session keys to delete');
    }
  } catch (error) {
    console.error('Error cleaning Redis:', (error as Error).message);
  } finally {
    await redis.quit();
  }

  console.log('\nCleanup completed!\n');
}

cleanup().catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
