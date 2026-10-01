# Blog web

SolidJS frontend for the Rust API in `../my-blog-api`.

## Local development

```sh
bun install --frozen-lockfile
bun run dev
```

Start the API separately with `cargo run --bin my-blog-api` in its repository.
Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:3000`
and preserves the browser Origin header. The API defaults `APP_ORIGIN` to
`http://localhost:5173`; when using another hostname or port, set it to the exact
browser origin. Avoid mixing `localhost` and `127.0.0.1` during a session.

The public blog is anonymous. `/studio/access` is the owner login and `/studio`
contains editorial tools. Hidden navigation is only a presentation choice;
the API enforces authentication, ownership and CSRF. There is no public signup.
Create the owner through the backend administration CLI, using its password
prompt. Never put owner credentials or signing keys in frontend environment
variables, fixtures, documentation or build artifacts.

## Validation

```sh
bun run build
bun run test
```

The API client uses HTTP-only cookies and keeps CSRF state in memory. It restores
CSRF after reload and coordinates refresh across tabs when Web Locks are available.
Session failures are distinguished from temporary service outages. Editorial
updates use the version/ETag returned by the API; conflicts require resolution.

## Production routing

Serve `dist/` over HTTPS and proxy `/api/` to the Rust service on the same origin.
The Vite development proxy is not included in the production build. Configure
SPA fallback to `index.html` for frontend routes, but never for `/api/` errors.
Preserve Origin, Cookie, Set-Cookie, If-Match, ETag and X-CSRF-Token headers.
Disable proxy caching for authenticated responses and respect API Cache-Control.

Set backend `APP_ENV=production`, `APP_ORIGIN` to the public HTTPS origin,
`OWNER_ONLY=true` and configure `JWT_KEYS_FILE` through a runtime secret mount.
Production cookies must remain secure. Keep SQLite on persistent local storage;
frontend files may be static, but the API requires persistent compute and storage.

## Integration verification

Verified with a disposable SQLite database and a fictional owner account:
login, create draft, publish, anonymous read, reload authenticated page,
unpublish (anonymous read returns 404), session listing and logout.
Automated coverage also exercises CSRF restoration, password rules, service
failures, access restrictions and optimistic concurrency.

## Remaining product capabilities

The current integration supports Markdown, summaries, tags, search and pagination.
The existing plans also describe capabilities that are not implemented end to end:

- Cover/media upload and delivery: schema fields exist, but no upload API or editor picker.
- Public filtering by tag: tags are displayed, but there is no matching filter contract.
- Scheduled publication: a status/date is modeled, but there is no publication worker.

These require feature work in both repositories; they are not activated by the
integration fixes. Production hosting and reverse-proxy provisioning are also
not configured in this repository.
