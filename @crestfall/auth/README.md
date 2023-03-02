## @crestfall/auth

#### Dependencies

- PostgreSQL
- PostgREST

#### Schemas

```ts
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
  metadata: Record<string, string|number|boolean>;
  created_at: string;
  updated_at: string;
}
```

#### Completed

- None

#### Planned / In Progress

- Email Sign up
  - POST /sign-up/email { email, password } -> { token }
- Phone Sign up
  - POST /sign-up/phone { phone, password } -> { token }
- Email Sign in
  - POST /sign-in/email { email, password } -> { token }
- Phone Sign in
  - POST /sign-in/phone { phone, password } -> { token }
- Email Verification
  - GET /verification/email/step-1 { token, email } -> { email_verification_code }
  - GET /verification/email/step-2 { email_verification_code } -> {}
- Phone Verification
  - GET /verification/phone/step-1 { token, phone } -> { phone_verification_code }
  - GET /verification/phone/step-2 { phone_verification_code } -> {}
- Email Recovery
  - GET /recovery/email/step-1 { email } -> {}
  - POST /recovery/email/step-2 { email, email_recovery_code, password } -> { token }
- Phone Recovery
  - GET /recovery/phone/step-1 { phone } -> {}
  - POST /recovery/phone/step-2 { phone, phone_recovery_code, password } -> { token }
- Account Update
  - GET /account { token } -> { name, email, phone, password }
  - PUT /account { token, name, email, phone, password } -> {}

#### License

MIT