- string normalization, string case-folding, scrypt-based password hashing, and creation of JWTs can be done within PostgreSQL, but there are concerns in putting auth within PostgreSQL itself such as OAuth, Single Sign-on (SSO), Rate Limits, etc. for now it's better as a separate auth server written in JavaScript for faster iteration.