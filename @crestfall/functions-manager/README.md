## @crestfall/functions

#### Dependencies

- PostgreSQL
- PostgREST

#### Schemas

```ts
interface function {
  id: string;
  platform: string;
  token: string;
  repository: string;
}
```

#### Completed

- None

#### Planned / In Progress

- Fetch Functions
  - GET /functions {} -> { functions[] }
- Create Function
  - POST /functions { platform, token, username, repository } -> {}

#### Under Review

- Functions Manager can fetch multiple repositories of Functions Server from GitHub.
- Functions Manager can host multiple instances of Functions Server.
- Functions Server can be run with custom ports. (needs more research and testing)
- Functions Server can be run locally. (needs more research and testing)
- Functions Server can be run in Docker Containers. (needs more research and testing)
- Examples of Functions Server
  - Authentication API
  - Authorization API
  - Media Processing API

#### License

MIT