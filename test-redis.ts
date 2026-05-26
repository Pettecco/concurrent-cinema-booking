import { redis } from './src/infra/redis/client.js';

await redis.set('test:mykey', 'hello from cinema-booking');
console.log('Saved! Check Redis Commander at http://localhost:8081');

await redis.quit();
