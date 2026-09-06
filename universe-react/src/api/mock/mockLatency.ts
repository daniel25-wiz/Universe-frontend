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
  if (ms > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, ms));
  }
  return value;
}