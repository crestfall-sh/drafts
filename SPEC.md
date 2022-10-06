## Specification

### Automated TLS

- 0.0.0.0:80,0.0.0.0:443
- Caddy

### Studio

- /studio
- 0.0.0.0:8080
- Vite + React + uWebSockets.js

### Authentication

- /authentication
- 0.0.0.0:8081
- Basic Authentication
- Magic Link Authentication
- Multi-factor Authentication
- API Authentication
- Bearer Authentication
- HMAC Authentication

### Authorization

- /authorization
- 0.0.0.0:8081
- Role-based Access Control (RBAC)
- Studio: show users, roles, role permissions

### Functions

- /functions
- 0.0.0.0:8082
- Node.js + JavaScript + uWebSockets.js
- Studio: show function logs and errors

### PostgreSQL

- 0.0.0.0:5432
- PostgreSQL
- Studio: show tables

### PostgreSQL REST API

- /postgresql/rest
- 0.0.0.0:5433
- PostgREST
- Studio: show rest api explorer

### PostgreSQL GraphQL API

- /postgresql/graphql
- 0.0.0.0:5434
- pg-graphql
- Studio: show graphql api explorer

### PostgreSQL Search API

- /postgresql/search
- 0.0.0.0:8108
- pgsql-http + TypeSense
- Studio: show tables & columns that needs to be synced to TypeSense
- Studio: show search interface similar to MeiliSearch

### PostgreSQL Events

- /postgresql/events
- 0.0.0.0:5435
- pgsql-http + crestfall_audit + uWebSockets.js
- Studio: show stream of events

### PostgreSQL Cron Jobs

- pg-cron
- Studio: show list of cron jobs

### PostgreSQL Logs

- pgaudit
- Studio: show logs

### SeaweeFS Storage API

- /seaweedfs
- 0.0.0.0:9333
- SeaweedFS
- Studio: show buckets and files

### Redis Pub/Sub

- Redis, uWebSockets.js

### Redis Cache

- Redis

### Deployment Architecture

- Monolith (Docker)
- Microservices (Kubernetes)

### Deployment Environment

- Development (Local)
- Staging (Managed / Self-hosted)
- Production (Managed / Self-hosted)

### References

- citus: https://github.com/citusdata/citus
- pg-graphql: https://github.com/supabase/pg_graphql
- pg-graphql: https://supabase.com/blog/pg-graphql
- pgsql-http: https://github.com/pramsey/pgsql-http
- pg-audit: https://github.com/pgaudit/pgaudit
- postgrest: https://github.com/PostgREST/postgrest
- postgraphile: https://github.com/graphile/postgraphile
- replibyte for seeding data: https://www.replibyte.com/docs/introduction
- typesense for search: https://github.com/typesense/typesense
- seaweedfs for storage: https://github.com/seaweedfs/seaweedfs
- vector for logs & metrics: https://vector.dev/
