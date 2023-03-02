## @crestfall/functions

#### Dependencies

- PostgreSQL
- PostgREST
- Redis

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

- None

#### License

MIT