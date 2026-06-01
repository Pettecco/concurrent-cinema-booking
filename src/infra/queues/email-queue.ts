import { Queue, Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { logger } from '../http/logger.js';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export const emailQueue = new Queue<EmailJobData>('emails', { connection });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: false,
});

export const emailWorker = new Worker<EmailJobData, void, string>(
  'emails',
  async (job: Job<EmailJobData>) => {
    const { to, subject, body, html } = job.data;

    logger.info({ jobId: job.id, to, subject }, 'Sending email');

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Cinema <noreply@cinema.com>',
      to,
      subject,
      text: body,
      html,
    });

    logger.info({ jobId: job.id, to }, 'Email sent');
  },
  {
    connection,
    concurrency: 5,
  }
);

emailWorker.on('error', error => {
  logger.error({ error }, 'Email worker error');
});

emailWorker.on('completed', job => {
  logger.info({ jobId: job?.id }, 'Email job completed');
});

emailWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Email job failed');
});
