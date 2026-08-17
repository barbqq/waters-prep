export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
}

export interface ApiResponse<TBody> {
  status: number;
  ok: boolean;
  body: TBody;
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
