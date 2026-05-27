export interface ILockService {
  acquire(key: string, ttlMS: number, userId: string): Promise<boolean>;
  release(key: string, userId: string): Promise<void>;
}
