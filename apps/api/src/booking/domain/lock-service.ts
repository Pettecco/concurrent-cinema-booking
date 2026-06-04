export interface ILockService {
  /**
   * Attempts to acquire a lock with a specified TTL.
   * @param key - The lock key (e.g., "lock:roomId:showtimeId:seatId")
   * @param ttlMS - Time to live in milliseconds
   * @param userId - ID of the user acquiring the lock
   * @returns true if lock was acquired, false if already held by another user
   */
  acquire(key: string, ttlMS: number, userId: string): Promise<boolean>;

  /**
   * Releases a lock if the user owns it.
   * @param key - The lock key
   * @param userId - ID of the user releasing the lock
   * @throws {LockNotOwnedError} If the lock is owned by another user
   */
  release(key: string, userId: string): Promise<void>;

  /**
   * Verifies if a user owns a lock.
   * @param key - The lock key
   * @param userId - ID of the user to verify
   * @returns true if the user owns the lock, false otherwise
   */
  verify(key: string, userId: string): Promise<boolean>;

  /**
   * Lists all active locks matching a prefix.
   * @param prefix - The key prefix to search (e.g., "lock:roomId:showtimeId:")
   * @returns Array of active locks with key, userId, and remaining TTL
   */
  listActive(prefix: string): Promise<{ key: string; userId: string; ttl: number }[]>;
}
