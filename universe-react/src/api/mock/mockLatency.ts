/**
 * Simulated network latency for the mock API.
 *
 * Every mock endpoint awaits withMockLatency() before resolving (success or
 * failure), so loading/error/empty states behave like a real network. Disable
 * it during development with VITE_MOCK_LATENCY=off.
 */
import { apiConfig } from '../config';

export function mockDelayMs(): number {
  const { enabled, min, max } = apiConfig.mockLatency;
  if (!enabled) return 0;
  return Math.round(min + Math.random() * (max - min));
}

/** Wait for a simulated network round-trip (300–800ms by default). */
export async function withMockLatency<T>(value: T | Promise<T>): Promise<T> {
  const ms = mockDelayMs();
  // Endpoints call this with an already-started promise, so a failing request
  // rejects while the latency timer is still ticking. Attaching a no-op handler
  // NOW marks that rejection as handled (the caller still receives it through
  // the returned promise) and keeps expected 4xx responses from being reported
  // as "unhandled rejection" console noise.
  if (value instanceof Promise) value.catch(() => {});
  if (ms > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, ms));
  }
  return value;
}