
import * as hs256 from 'modules/hs256';

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

export interface public_user {
  id: string;
  email: string;
}

export interface role {
  id: string;
  name: string;
  permissions?: permission[];
}

export interface permission {
  id: string;
  role_id: string;
  scopes: string[];
  description: string;
}

export interface assignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by_user_id?: string;
  assigned_at?: string;
  role?: role;
}

export interface setting {
  id: string;
  key: string;
  value: string;
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

export type callback = (token: string, token_data: hs256.token_data) => void;
export type subscribe = (callback: callback) => void;
export type unsubscribe = (callback: callback) => void;
export type subscribers = Set<callback>;