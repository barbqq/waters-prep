import { LogEntry } from '@core/api/api.types';

// Сколько последних записей подмешивать в текст ошибки: три пары запрос/ответ —
// достаточно, чтобы увидеть упавший вызов и то, что было прямо перед ним.
const RECENT_ENTRIES = 6;

export class ApiLogger {
  private readonly logs: LogEntry[] = [];

  logRequest(method: string, url: string, body?: unknown): void {
    this.logs.push({ type: 'request', method, url, body });
  }

  logResponse(status: number, body?: unknown): void {
    this.logs.push({ type: 'response', status, body });
  }

  getRecentLogs(): string {
    return this.logs
      .slice(-RECENT_ENTRIES)
      .map((log) => `=== ${log.type} ===\n${JSON.stringify(log, null, 2)}`)
      .join('\n\n');
  }
}
