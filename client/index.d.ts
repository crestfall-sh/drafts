
export interface user {
  id: string;
  email: string;
  invitation_code: string;
  invited_at: string;
  verification_code: string;
  verified_at: string;
  recovery_code: string;
  recovered_at: string;
  password_salt: string;
  password_key: string;
  metadata: Record<string, string|number|boolean>;
  created_at: string;
  updated_at: string;
}

export interface role {
  id: string;
  name: string;
}

export interface permission {
  id: string;
  role_id: string;
  resource: string;
  actions: string[];
}

export interface assignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by_user_id?: string;
  assigned_at?: string;
}

export interface postgrest_request_options<T> {
  protocol: string;
  host: string;
  token: string;
  method?: string;
  headers?: Record<string, string>;
  pathname: string;
  search?: Record<string, string>;
  json?: T;
}

export interface postgrest_response<T> {
  status: number;
  headers: Headers;
  body: T;
}

export interface sign_up_response {
  user: user;
  token: string;
}
export interface sign_in_response {
  user: user;
  token: string;
}
export interface refresh_token_response {
  token: string;
}
export interface auth_response_error {
  name: string;
  message: string;
  stack: string;
}
export interface auth_response_body<T> {
  data?: T;
  error?: auth_response_error
}
export interface auth_response<T> {
  status: number;
  body: auth_response_body<T>;
}
export type sign_up = (email: string, password: string) => auth_response<sign_up_response>;
export type sign_in = (email: string, password: string) => auth_response<sign_in_response>;
export type refresh_token = () => auth_response<refresh_token_response>;
export type postgrest_request = (postgrest_request_options: postgrest_request_options<any>) => postgrest_response<any>;