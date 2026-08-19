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

export enum ContentType {
  JSON = 'application/json',
}

export interface ApiResponse<TBody> {
  status: number;
  ok: boolean;
  body: TBody;
}
