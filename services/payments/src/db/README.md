# db layer (no migrations)

This folder exposes a single Postgres connection pool and small helpers.

- `client.js` — creates the `pg.Pool`, exports:
  - `query(sql, params?)`
  - `withTransaction(fn)` — runs `fn` inside a DB transaction
  - `healthcheck()`
  - `shutdownPool()`

## Environment

Set `DATABASE_URL` in `.env`, e.g.:

DATABASE_URL=postgresql://smunch:smunch@localhost:5432/smunch_orders


If your Postgres needs SSL (e.g., cloud DB), enable the `ssl` option in `client.js`.
