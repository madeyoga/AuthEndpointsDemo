# AuthEndpoints Demo

Standalone demo for [AuthEndpoints](https://github.com/madeyoga/AuthEndpoints): an ASP.NET Core API plus a Nuxt UI playground.

```
AuthEndpointsDemo/
  Demo/   # ASP.NET Core API (.NET 10)
  web/    # Nuxt 4 + Nuxt UI playground
```

## Prerequisites

- .NET 10 SDK
- Node.js 20+ and [pnpm](https://pnpm.io/)
- Optional: GitHub / Google OAuth app credentials for external login

## API (`Demo/`)

```bash
cd Demo
cp .env.example .env   # if you do not already have .env
dotnet restore
dotnet run --launch-profile http
```

API listens on **http://localhost:5041**.

| Variable | Purpose |
|----------|---------|
| `FRONTEND_ORIGIN` | CORS origin for the Nuxt app (default `http://localhost:3000`) |
| `DB_CONNECTION_STRING` | SQLite connection string |
| `JWT_SYMMETRIC_KEY` | JWT signing key (32+ chars) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth |

Packages: `AuthEndpoints` **3.0.0-rc.2**, `AuthEndpoints.External.OAuth` **3.0.0-preview.2**.

OpenAPI / Scalar: http://localhost:5041/scalar

Emails (confirmation, password reset) are written to the **API console** via `ConsoleEmailSender`.

### Route prefixes

| Area | Prefix |
|------|--------|
| Cookie + account management | `/auth/cookie` |
| JWT | `/auth/jwt` |
| Passkeys | `/auth/passkey` |
| External OAuth | `/auth/external` |

## UI (`web/`)

```bash
cd web
cp .env.example .env   # NUXT_PUBLIC_API_BASE=http://localhost:5041
pnpm install
pnpm dev
```

UI listens on **http://localhost:3000**.

Use the header **Cookie / JWT** toggle, walk each nav panel, and watch the **response inspector**.

Suggested flow:

1. Diagnostics → Create default user (or Register a new account)
2. Confirm email using the link logged in the API console (Account → Paste link)
3. Cookie Auth or JWT Auth → sign in
4. Account Info / Security / Passkeys / External as needed

## Notes

- Cookie and JWT refresh flows need `credentials: include` and CSRF (`RequestVerificationToken` from `/auth/cookie/csrfToken` or `/auth/jwt/csrfToken`).
- Sensitive manage / passkey mutations require ReAuth (`confirmIdentity`, then `X-AuthEndpoints-Reauth` or the ReAuth cookie).
- Passkeys use `Passkeys.ServerDomain = localhost`.
