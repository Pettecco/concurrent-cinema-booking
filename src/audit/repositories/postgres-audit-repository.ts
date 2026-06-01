import type { Knex } from 'knex';

export interface AuditEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface IAuditRepository {
  create(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<void>;
  createMany(events: Omit<AuditEvent, 'id' | 'createdAt'>[]): Promise<void>;
}

export class PostgresAuditRepository implements IAuditRepository {
  constructor(private readonly db: Knex) {}

  async create(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<void> {
    await this.db('audit_events').insert({
      event_type: event.eventType,
      payload: event.payload,
    });
  }

  async createMany(events: Omit<AuditEvent, 'id' | 'createdAt'>[]): Promise<void> {
    if (events.length === 0) return;

    await this.db('audit_events').insert(
      events.map((e) => ({
        event_type: e.eventType,
        payload: e.payload,
      }))
    );
  }
}
