export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface RequestLog {
  type: 'request';
  method: string;
  url: string;
  body?: unknown;
}

export interface ResponseLog {
  type: 'response';
  status: number;
  body?: unknown;
}

export type LogEntry = RequestLog | ResponseLog;
