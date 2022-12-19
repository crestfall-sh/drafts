export interface request_options<T> {
  protocol: string;
  hostname: string;
  port: number;
  token: string;
  method?: string;
  headers?: Record<string, string>;
  pathname: string;
  search?: Record<string, string>;
  json?: T;
}

export interface response<T> {
  request_options: request_options<any>;
  status: number;
  headers: Headers;
  body: T;
}

export type request = (request_options: request_options<any>) => response<any>;