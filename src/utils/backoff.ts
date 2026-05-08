// Exponential Backoff Utility for Reconnection

export interface BackoffOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onAttempt?: (attempt: number, delay: number) => void;
  onMaxAttemptsReached?: () => void;
}

export interface BackoffResult {
  success: boolean;
  attempts: number;
}

/**
 * Execute a function with exponential backoff retry
 */
export async function withExponentialBackoff(
  fn: () => Promise<void>,
  options: BackoffOptions = {}
): Promise<BackoffResult> {
  const {
    maxAttempts = 5,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    onAttempt,
    onMaxAttemptsReached,
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fn();
      return { success: true, attempts: attempt };
    } catch (err) {
      if (attempt === maxAttempts) {
        onMaxAttemptsReached?.();
        return { success: false, attempts: attempt };
      }
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      onAttempt?.(attempt, delay);
      await sleep(delay);
    }
  }

  return { success: false, attempts: maxAttempts };
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay for given attempt number
 */
export function calculateDelay(attempt: number, baseDelayMs: number = 1000, maxDelayMs: number = 30000): number {
  return Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
}