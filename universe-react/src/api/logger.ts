/**
 * Development-only API logging.
 *
 * Emits a short, consistent `[API]` log line for every request so the flow can
 * be traced in the browser console. Never logs passwords, tokens or bodies.
 */

export function logApi(method: string, path: string, info?: string): void {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console.info(`[API] ${method} ${path}${info ? ` — ${info}` : ''}`);
}