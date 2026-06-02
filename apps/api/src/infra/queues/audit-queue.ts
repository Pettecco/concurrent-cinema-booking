import { Queue, Worker, Job } from 'bullmq';
import { logger } from '../http/logger.js';
import { db } from '../postgres/client.js';
import { PostgresAuditRepository } from '../../audit/repositories/postgres-audit-repository.js';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export interface AuditJobData {
  eventType: string;
  payload: Record<string, unknown>;
}

export const auditQueue = new Queue<AuditJobData>('audit', { connection });

const auditRepo = new PostgresAuditRepository(db);

export const auditWorker = new Worker<AuditJobData, void, string>(
  'audit',
  async (job: Job<AuditJobData>) => {
    const { eventType, payload } = job.data;

    logger.info({ jobId: job.id, eventType }, 'Processing audit event');

    await auditRepo.create({ eventType, payload });

    logger.info({ jobId: job.id, eventType }, 'Audit event saved');
  },
  {
    connection,
    concurrency: 10,
  }
);

auditWorker.on('error', (error) => {
  logger.error({ error }, 'Audit worker error');
});

auditWorker.on('completed', (job) => {
  logger.info({ jobId: job?.id }, 'Audit job completed');
});

auditWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Audit job failed');
});
