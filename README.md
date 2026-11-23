# `{{NEW_STORE_NAME}}`

> **Target:** a production-ready e-commerce store built from the existing Anando Deal monorepo.  
> **Current state:** the code is still branded as Anando Deal. Rebranding and new features are planned but not yet implemented.  
> **Planning:** see [PROJECT_PLAN.md](./PROJECT_PLAN.md) and [BRAND_CONFIG.md](./BRAND_CONFIG.md).

## Stack

- **Web:** React 19, Vite 8, TypeScript 6, Tailwind CSS v4, shadcn-style UI primitives, Framer Motion, TanStack Query, Zustand, React Router 7, React Hook Form, Zod
- **API:** Node.js 24+, Express 5, Mongoose 9, Zod 4, JWT, bcryptjs
- **Database:** MongoDB 8 (Atlas or local)
- **Integrations:** Cloudinary uploads, Resend/SMTP email; bKash manual payment and manual courier fields are available now
- **Shared contracts:** Zod schemas, types, enums, labels, and business defaults in `packages/shared`

## Repository structure

### Current structure

```text
apps/web        React storefront + admin SPA
apps/api        Express/Mongoose API + integration tests
packages/shared Shared Zod schemas, types, and constants
api             Vercel serverless entry point
```

### Proposed structure

New directories and files are added by the phases in `PROJECT_PLAN.md`. The existing architecture and conventions are preserved.

```text
root
├── api/
│   └── index.ts                         Vercel serverless wrapper
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/                  env, DB, logger, future brand config
│   │   │   ├── middleware/              auth, RBAC, rate limits, errors
│   │   │   ├── models/                  current + planned domain models
│   │   │   ├── modules/                 route/service pairs by domain
│   │   │   ├── routes/                  public/admin router composition
│   │   │   ├── services/                pricing, delivery, notifications, PDF
│   │   │   ├── utils/
│   │   │   └── scripts/seed.ts
│   │   └── tests/                       API integration tests
│   └── web/
│       └── src/
│           ├── components/              shared UI, layout, admin components
│           ├── hooks/                   TanStack Query domain hooks
│           ├── lib/                     API client, types, helpers, SEO
│           ├── pages/                   storefront + account/cart pages
│           ├── pages/admin/             admin management pages
│           └── stores/                  client state
└── packages/shared/src/                 contracts, brand config, money utilities
```

Planned modules include customers, wishlist, reviews, coupons, inventory, delivery zones, promotions, flash sales, returns/refunds, carts, invoices, courier adapters, and an outbox/retry service. None are implemented yet.

## Requirements

- Node.js 24+ (CI uses Node 24)
- npm 11+
- MongoDB 8, Atlas or local. Docker Compose can start local MongoDB.
- Optional: Cloudinary credentials for uploads; Resend or SMTP credentials for email.

## Local development

Install dependencies:

```bash
npm ci
```

Create local environment files from the tracked templates:

```bash
# Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Set `MONGODB_URI_LOCAL` in `apps/api/.env` for local development. Set `MONGODB_URI` only in the production host with `NODE_ENV=production`; it is ignored outside production. Existing `.env` files are ignored by Git and are not overwritten by this repository setup. Never commit secrets.

Start the web app and API:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:web
npm run dev:api
```

Local URLs:

- Web: http://localhost:5173
- API: http://localhost:4000
- Health: http://localhost:4000/api/health
- Shop: http://localhost:5173/shop
- Admin login: http://localhost:5173/admin/login

The Vite dev server proxies `/api` to port 4000. `VITE_*` variables are public by design and must not contain secrets.

## MongoDB and seed data

Local MongoDB via Docker:

```bash
docker compose up -d
```

Or use an installed MongoDB service/Atlas cluster. Development uses `MONGODB_URI_LOCAL` when `NODE_ENV` is not `production`; production uses `MONGODB_URI`. Both must start with `mongodb://` or `mongodb+srv://`. The current example database name is `Anando Deal`; the new name will be defined in `BRAND_CONFIG.md`.

Seed categories, sample products, settings, and the first admin:

```bash
npm run seed -w @anando-deal/api
```

The seed reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `apps/api/.env`. Supply real credentials before exposing the app. The seed catalog is business-specific and will be replaced during rebranding.

## Scripts

| Command                            | Description                              |
| ---------------------------------- | ---------------------------------------- |
| `npm run dev`                      | Build shared package, then run web + API |
| `npm run dev:web`                  | Run the Vite dev server                  |
| `npm run dev:api`                  | Run the API with hot reload              |
| `npm run build:shared`             | Build the shared contracts package       |
| `npm run build`                    | Build shared, web, and API               |
| `npm run typecheck`                | Typecheck all workspaces                 |
| `npm run lint`                     | Lint the repository                      |
| `npm test`                         | Run API integration tests                |
| `npm run seed -w @anando-deal/api` | Seed initial data                        |
| `npm run format`                   | Format files with Prettier               |

Workspace names are currently `@anando-deal/web`, `@anando-deal/api`, and `@anando-deal/shared`. Scripts keep working until the scoped rebrand phase updates all manifests and deployment configuration together.

If typecheck reports that it cannot find `@anando-deal/shared`, delete the copied dependency directory state by running `npm ci` from the repository root, then run `npm run build:shared`. This recreates npm workspace links and builds the shared declarations; it does not change application source.

## Testing

The current suite uses Vitest + Supertest against a real MongoDB database. CI starts MongoDB 8 automatically.

```bash
npm run build:shared
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` clears and drops the configured test database. Keep `MONGODB_URI_TEST` pointed only at a disposable test database; its current default is `anando_deal_test`.

Current coverage includes auth, health, basic catalog CRUD, core checkout/stock behavior, settings carousel, and the unconfigured-upload error path. Additional test layers are specified in `PROJECT_PLAN.md`.

## Existing routes

### Storefront

| Route                 | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `/`                   | Home page with configurable hero slides                       |
| `/shop`               | Catalog with keyword, category, sort, and pagination          |
| `/product/:slug`      | Product detail with variant selection and cart actions        |
| `/checkout`           | Guest checkout with COD or manual bKash                       |
| `/order/:orderNumber` | Confirmation/status page; phone supplied as a query parameter |
| `/track`              | Order lookup                                                  |
| `/contact`            | Support contact form with email delivery                      |
| `/l/:code`            | Campaign link redirect and click tracking                     |

Order lookup and phone-in-URL behavior are documented as a security issue to fix before launch.

### Admin

| Route                                             | Purpose                                            |
| ------------------------------------------------- | -------------------------------------------------- |
| `/admin/login`                                    | Admin sign-in                                      |
| `/admin`                                          | Dashboard/KPIs/analytics                           |
| `/admin/orders`                                   | Order list/filters                                 |
| `/admin/orders/:orderNumber`                      | Order detail/status/payment/notes                  |
| `/admin/products`                                 | Product list                                       |
| `/admin/products/new`, `/admin/products/:id/edit` | Product/variant/media/SEO forms                    |
| `/admin/categories`                               | Category management                                |
| `/admin/links`                                    | Campaign links and performance                     |
| `/admin/support`                                  | Support inbox, status and email replies            |
| `/admin/settings`                                 | Store, hero, delivery, alerts, and social settings |

Admin API routes are under `/api/admin` and use HTTP-only JWT cookies. Customer accounts and broader role enforcement are planned; sending test emails is owner-only.

## Media uploads

Product images (max 5 MB) and videos (max 50 MB) upload through:

- `POST /api/admin/uploads/image`
- `POST /api/admin/uploads/video`

The multipart field is `file`. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable uploads; otherwise the endpoints return `503 UPLOAD_NOT_CONFIGURED`.

## Payments and fulfilment

- `COD` — cash on delivery, available now.
- `BKASH_MANUAL`, `NAGAD_MANUAL`, `ROCKET_MANUAL` — customer sends money to the configured merchant number and submits a transaction ID for seller verification, available now.
- `BKASH_PGW` — reserved but not integrated; do not expose it in checkout until implemented.

Configure bKash, Nagad, and Rocket merchant numbers under `/admin/settings` → Store details (or with `BKASH_MERCHANT_NUMBER`, `NAGAD_MERCHANT_NUMBER`, and `ROCKET_MERCHANT_NUMBER`).

- Courier provider and tracking ID fields are manual only. API/webhook integrations are planned.

## Support mail

The storefront contact form posts to `POST /api/support` (rate limited to 5 messages per 15 minutes per IP). Messages are always saved to the support inbox at `/admin/support`, even when mail is unavailable.

To enable email delivery:

1. Set `EMAIL_PROVIDER=resend` (with `RESEND_API_KEY` and `EMAIL_FROM`) or `EMAIL_PROVIDER=smtp` (with `SMTP_*` values).
2. **Support email** defaults to `rabuofficial007@gmail.com`; change it under `/admin/settings` → Store details. If it is empty, `SELLER_ALERT_EMAILS` and admin alert emails are used instead.
3. Use **Send test email** in Alerts to verify the provider (owner-only, rate limited).

Each new message emails the support recipient with `reply-to` set to the customer, sends the customer an acknowledgement with a `SUP-#####` reference, and records delivery status in the admin inbox. Admins can reply from the inbox; replies are emailed to the customer and archived with the message.

## Deployment

Vercel configuration builds shared → API → web, serves `apps/web/dist`, and routes API traffic through `api/index.ts`. The current `/api/(.*) → /api` rewrite is under review because it may collapse all API paths to the root handler. Verify `/api/health` and `/api/products` on every deployment until resolved.

Set all secrets in the hosting platform, not in source control. Ensure production sets `NODE_ENV=production` and `MONGODB_URI` to the online database connection string; do not set `MONGODB_URI_LOCAL` in production. Review the full deployment checklist in `PROJECT_PLAN.md` before production release.

## Coding standards

- ESM imports; API/shared TypeScript imports use explicit `.js` specifiers.
- Strict TypeScript with `noUncheckedIndexedAccess`.
- Prettier: single quotes, semicolons, trailing commas, 100-character width, two-space indentation.
- Functional React components; pages are default exports and lazy-loaded; components/hooks are named exports.
- Domain hooks live in `hooks/use-<domain>.ts`; API route/service pairs live in `modules/<domain>/`.
- Validate HTTP boundaries with shared Zod schemas and return domain errors through `AppError`.
- Reuse existing UI primitives, admin helpers, API client, and hook invalidation patterns.

## Documentation

- [PROJECT_PLAN.md](./PROJECT_PLAN.md) — architecture, feature inventory, gap analysis, phased implementation, database/API changes, testing, and deployment.
- [BRAND_CONFIG.md](./BRAND_CONFIG.md) — all values that must be supplied or changed for the new business.

## Phase status

Implementation has not started. See the phase completion log in `PROJECT_PLAN.md` for authoritative status.

- [x] Phase 0: Discovery and planning
- [ ] Phases 1–14: brand decisions through production launch
