export interface ILockService {
  /**
   * Acquires a lock for a specific key.
   * @param key - The resource key to lock.
   * @param ttlMS - Time-to-live for the lock in milliseconds.
   * @param userId - The ID of the user requesting the lock.
   * @returns True if the lock was acquired, false otherwise.
   */
  acquire(key: string, ttlMS: number, userId: string): Promise<boolean>;

  /**
   * Releases a previously acquired lock.
   * @param key - The resource key to unlock.
   * @param userId - The ID of the user releasing the lock.
   */
  release(key: string, userId: string): Promise<void>;

  /**
   * Verifies if a lock is held by a specific user.
   * @param key - The resource key to check.
   * @param userId - The ID of the user to verify.
   * @returns True if the user holds the lock, false otherwise.
   */
  verify(key: string, userId: string): Promise<boolean>;
}
