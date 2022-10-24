
export interface postgrest_request_options {
  method: string;
  headers?: Record<string, string>;
  pathname: string;
  search?: Record<string, string>;
  json?: any;
}

export interface postgrest_response {
  status: number;
  headers: Headers;
  body: any;
}

export type postgrest_request = (postgrest_request_options: postgrest_request_options) => postgrest_response;