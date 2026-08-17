export interface RequestLog {
  type: 'request';
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface ResponseLog {
  type: 'response';
  status: number;
  body?: unknown;
}

export type LogEntry = RequestLog | ResponseLog;
