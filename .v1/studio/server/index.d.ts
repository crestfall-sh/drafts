
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