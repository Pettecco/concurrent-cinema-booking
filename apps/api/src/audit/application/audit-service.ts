import { auditQueue } from '../../infra/queues/audit-queue.js';

export class AuditService {
  async emit(eventType: string, payload: Record<string, unknown>) {
    await auditQueue.add('audit-event', { eventType, payload }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}
