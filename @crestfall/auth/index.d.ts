interface user {
  id: string;
  email: string;
  email_verification_code: string;
  email_verified_at: string;
  email_recovery_code: string;
  email_recovered_at: string;
  phone: string;
  phone_verification_code: string;
  phone_verified_at: string;
  phone_recovery_code: string;
  phone_recovered_at: string;
  password_salt: string;
  password_hash: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type email_sign_in = (email: string, password: string) => Promise<void>;
export type phone_sign_up = (phone: string, password: string) => Promise<void>;
 
