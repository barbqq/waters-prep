import { LogEntry } from '@core/api/api.types';

export class ApiLogger {
  private readonly logs: LogEntry[] = [];

  logRequest(method: string, url: string, headers: Record<string, string>, body?: unknown): void {
    this.logs.push({ type: 'request', method, url, headers, body });
  }

  logResponse(status: number, body?: unknown): void {
    this.logs.push({ type: 'response', status, body });
  }

  getRecentLogs(): string {
    return this.logs
      .map((log) => `=== ${log.type} ===\n${JSON.stringify(log, null, 2)}`)
      .join('\n\n');
  }
}
