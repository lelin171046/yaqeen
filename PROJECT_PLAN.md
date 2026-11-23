# Project Plan — Anando Deal

> **Status:** Phase 1 is in progress and blocked; targeted rebrand repairs and homepage redesign work are complete and validated.  
> **Baseline:** copied Anando Deal full-stack e-commerce monorepo.  
> **Last updated:** 2026-11-19  
> **Brand values:** supplied Phase 1 values are recorded in `BRAND_CONFIG.md`; remaining values are explicitly marked TO BE PROVIDED.

## 1. Purpose and rules

This plan converts the existing, working monorepo into a different e-commerce business while preserving:

- The existing React/Vite + Express/Mongoose + shared Zod package stack.
- Existing public/admin API routes and response envelopes.
- Existing working checkout, stock, order tracking, dashboard, upload, settings, and campaign-link behavior.
- Existing coding standards, strict TypeScript settings, ESLint/Prettier conventions, and module layout.
- Local `.env` files and production database configuration. They must not be overwritten.

Changes should be additive and incremental. Prefer new optional fields, new endpoints, and new modules over rewriting existing services. Where a breaking data change is unavoidable, provide a compatibility shim and migration plan.

## 2. Complete architecture

### 2.1 Runtime topology

| Layer                  | Technology                                                                                                     | Entry points                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Storefront/admin SPA   | React 19, Vite 8, TypeScript 6, Tailwind CSS v4, TanStack Query, Zustand, React Router 7, React Hook Form, Zod | `apps/web/src/main.tsx`, `apps/web/src/App.tsx`                |
| API                    | Node.js, Express 5, Mongoose 9, Zod 4, JWT, bcryptjs                                                           | `apps/api/src/server.ts`, `apps/api/src/app.ts`                |
| Serverless API wrapper | Vercel function with cached Mongoose connection                                                                | `api/index.ts`                                                 |
| Shared contracts       | Zod schemas, enums, labels, business constants, money formatters                                               | `packages/shared/src/index.ts`, `packages/shared/src/money.ts` |
| Database               | MongoDB 8; Atlas in production, local/Docker for development                                                   | `MONGODB_URI`, `MONGODB_URI_TEST`                              |
| Media                  | Cloudinary image/video uploads                                                                                 | `apps/api/src/services/cloudinary.ts`                          |
| Email                  | Resend or SMTP                                                                                                 | `apps/api/src/services/email.ts`                               |
| CI/CD                  | GitHub Actions verification; Vercel deployment configuration                                                   | `.github/workflows/ci.yml`, `vercel.json`                      |

The Vite dev server proxies `/api` to `http://localhost:4000`. Production serves `apps/web/dist` and routes `/api/*` to the Vercel function.

### 2.2 Existing source layout

```text
root
├── api/
│   └── index.ts                    Vercel serverless entry
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/             env, DB, logger
│   │   │   ├── middleware/         auth, errors, rate limit
│   │   │   ├── models/             Admin, Category, Product, Order,
│   │   │   │                       OrderLink, LinkClick, Counter,
│   │   │   │                       NotificationLog, Settings
│   │   │   ├── modules/            auth, categories, products, orders,
│   │   │   │                       dashboard, links, settings, uploads
│   │   │   ├── routes/             public and admin router composition
│   │   │   ├── scripts/seed.ts
│   │   │   ├── services/           Cloudinary, email, order notifications
│   │   │   └── utils/              tokens, cookies, passwords, slugs, errors
│   │   └── tests/                  Vitest + Supertest integration tests
│   └── web/
│       └── src/
│           ├── components/         layout, product, carousel, UI, admin UI
│           ├── hooks/              catalog, orders, settings, admin hooks
│           ├── lib/                API client, types, errors, uploads, helpers
│           ├── pages/              storefront pages
│           ├── pages/admin/        admin pages
│           └── stores/cart.ts      persisted Zustand cart
├── packages/shared/src/            cross-app contracts and constants
├── docker-compose.yml              local MongoDB only
├── vercel.json
└── .github/workflows/ci.yml
```

### 2.3 Proposed layout after implementation

The directory shape stays consistent. New files are grouped by existing domain conventions.

```text
apps/api/src/
├── models/
│   ├── customer.ts                 NEW
│   ├── wishlist.ts                 NEW
│   ├── review.ts                   NEW
│   ├── coupon.ts                   NEW
│   ├── inventory-movement.ts       NEW
│   ├── delivery-zone.ts            NEW or Settings subdocument
│   ├── promotion.ts                NEW
│   ├── flash-sale.ts               NEW
│   ├── return-request.ts           NEW
│   ├── cart.ts                     NEW
│   ├── outbox-event.ts             NEW
│   ├── invoice.ts                  NEW
│   └── audit-log.ts                NEW
├── modules/
│   ├── customers/                  NEW
│   ├── wishlist/                   NEW
│   ├── reviews/                    NEW
│   ├── coupons/                    NEW
│   ├── inventory/                  NEW
│   ├── promotions/                 NEW
│   ├── flash-sales/                NEW
│   ├── returns/                    NEW
│   ├── carts/                      NEW
│   ├── invoices/                   NEW
│   └── courier/                    NEW adapter layer + webhook
├── services/
│   ├── pricing.ts                  NEW central price resolver
│   ├── delivery.ts                 NEW central delivery quote resolver
│   ├── notifications.ts            EXTEND existing notification services
│   ├── whatsapp.ts                 NEW or remove dead config
│   └── pdf.ts                      NEW
└── config/brand.ts                 NEW non-secret brand/business config

apps/web/src/
├── pages/
│   ├── cart.tsx                    NEW
│   ├── account/                    NEW login, profile, orders, wishlist
│   ├── reviews/                    NEW if dedicated pages are needed
│   └── admin/
│       ├── customers.tsx           NEW
│       ├── coupons.tsx             NEW
│       ├── inventory.tsx           NEW
│       ├── reviews.tsx             NEW
│       ├── returns.tsx             NEW
│       ├── promotions.tsx          NEW
│       └── flash-sales.tsx         NEW
├── hooks/                          one `use-<domain>.ts` file per module
├── components/                     reuse existing UI/admin primitives
└── lib/seo.ts                      NEW document head/JSON-LD helper

packages/shared/src/
├── brand.ts                        NEW canonical non-secret brand constants
├── commerce.ts                     NEW pricing/delivery/state contracts
└── index.ts                        EXTEND with additive schemas only
```

No new framework, ORM, CSS system, or state-management library is proposed.

## 3. Existing feature inventory

### 3.1 Foundation and operations

| Feature                      | State                  | Notes                                                                         |
| ---------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| npm workspaces               | Working                | `apps/*`, `packages/*`; shared package built before apps                      |
| Strict TypeScript            | Working                | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `isolatedModules` |
| ESLint/Prettier/EditorConfig | Working                | Flat ESLint config; Prettier has no CI check                                  |
| Build/typecheck/test scripts | Working                | Root commands orchestrate workspaces                                          |
| GitHub Actions               | Working                | Node 24, MongoDB 8 service, install/build-shared/lint/typecheck/test/build    |
| Docker MongoDB               | Working                | Local MongoDB 8 only; no API/web containers                                   |
| Vercel deployment            | Configured, unverified | `/api/(.*) → /api` rewrite is a likely routing defect                         |
| Health endpoint              | Working but weak       | Returns HTTP 200 even when database is degraded                               |
| Logging                      | Partial                | Pino with redaction plus Morgan; Morgan logs URLs containing phones           |

### 3.2 Storefront

| Feature              | State                | Notes                                                                          |
| -------------------- | -------------------- | ------------------------------------------------------------------------------ |
| Responsive home page | Working              | Hero carousel, categories, popular/new products, trust and campaign sections   |
| Catalog              | Working              | Search, category, sort, pagination; price/tag/rating facets absent             |
| Product detail       | Working              | Gallery, variants/size, quantity, nutrition, ingredients, add to cart          |
| Cart                 | Working              | Zustand persisted local cart keyed by product + variant SKU                    |
| Guest checkout       | Working              | COD and manual bKash, server-side prices, idempotency key                      |
| Delivery charge      | Partial              | Settings-driven but hardcoded Dhaka/inside/outside name matching               |
| Order confirmation   | Working              | Status, timeline, items, totals, address, payment details                      |
| Order tracking       | Working but insecure | Order number + phone; no OTP or meaningful rate limit                          |
| Campaign links       | Partial              | Link creation/click tracking works; destination and UTM handoff are incomplete |
| Product video        | Data only            | Admin can upload/store it; storefront never renders it                         |
| SEO/social sharing   | Partial              | Static index metadata; product SEO fields are saved but not applied            |

### 3.3 Admin

| Feature                           | State                   | Notes                                                                        |
| --------------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| Admin auth                        | Working                 | bcrypt, JWT access/refresh cookies, token version revocation                 |
| Dashboard                         | Working                 | KPIs, sales chart, status/payment breakdowns, top products, low stock, links |
| Category CRUD                     | Working                 | Unique slugs, image upload, delete blocked when products exist               |
| Product CRUD                      | Working                 | Variants/SKUs, images, video, nutrition, SEO fields, soft delete             |
| Order management                  | Working                 | Filters, detail, status/payment/notes updates, courier/tracking on shipped   |
| Store settings                    | Working                 | Hero carousel, contact, delivery, alerts, social links                       |
| Uploads                           | Working when configured | Image 5 MB/video 50 MB, Cloudinary; MIME-only validation                     |
| Role management                   | Missing                 | `OWNER`/`ADMIN` exists but is never enforced; no admin CRUD                  |
| Customers/reviews/coupons/returns | Missing                 | Requested features are not implemented                                       |

### 3.4 Data model

Working collections: `admins`, `categories`, `counters`, `products`, `orders`, `orderlinks`, `linkclicks`, `notificationlogs`, `settings`.

Notable existing capabilities:

- Atomic counter for sequential order numbers.
- Product variants with labels, grams, price, compare-at price, stock, SKU.
- Server-side order-line snapshots and conditional stock decrement.
- Idempotency key with a unique sparse index.
- Daily order sequence now formatted `AD-YYMMDD-####`; historical `YQ-` numbers remain readable.
- Link-click TTL index of 180 days.
- Notification-log fields for retries, but no retry worker.
- Text index on products that is unused; search uses regex.

## 4. Reusable functionality

Reuse these rather than creating parallel implementations:

### Backend

- `AppError` factories, `asyncHandler`, centralized error handler.
- Zod request schemas and enum/label arrays in `@anando-deal/shared`.
- `ensureUniqueSlug`, `nextSequence`, password/token/cookie utilities.
- `requireAuth` plus new role middleware layered on top.
- Mongoose model/serializer conventions (`toSafeAdmin`, `toPublicOrder`, `toAdminOrder`, `serializeLink`).
- Settings singleton with public/admin projections and env fallbacks.
- Cloudinary and email provider abstractions.
- `NotificationLog` schema as the basis for an outbox/retry system.
- Existing stock decrement/restore logic as the basis for a centralized inventory ledger.
- Existing order status history as the basis for cancellation/return/refund audit trails.

### Frontend

- UI primitives: `Button`, `Badge`, `Input`, `Label`, `Select`, `Textarea`.
- `ProductCard`, `OfferCarousel`, `SiteLayout`, `SiteHeader`, `SiteFooter`.
- `AdminLayout`, `RequireAdmin`, and all helpers in `components/admin/ui.tsx`.
- Axios client plus `getApiErrorMessage`.
- Domain hook pattern in `hooks/use-*.ts`, including query invalidation helpers.
- Zod-safeParse field-error pattern used by checkout and admin forms.
- Persisted cart store as the basis for server-backed carts and abandoned-cart capture.
- Existing administrative form patterns for products, categories, links, and settings.
- Existing order detail views as the basis for invoice/packing slip and return screens.

## 5. New feature requirements and gap analysis

Status legend: **Existing** = usable, **Partial** = needs hardening, **Missing** = not implemented.

| Requested feature                           | Status  | Required work                                                                                                                                                                                                                         |
| ------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product variants and SKU management         | Partial | Already supports label/grams/price/stock/SKU. Add stable `variantId` in order lines, unique SKU index, barcode, default variant, per-variant low-stock threshold, variant images, SKU history, and atomic variant patching.           |
| Wishlist and customer accounts              | Partial | Persistent guest wishlist, product-card heart, header count, and `/wishlist` page are implemented with Zustand/localStorage. Customer auth, server-side wishlist sync, account pages, and guest-to-account claim flow remain missing. |
| Product reviews and ratings                 | Missing | Add verified-purchase reviews, 1–5 ratings, moderation, helpful votes, aggregate rating fields, product-page display, and admin moderation.                                                                                           |
| Coupon and discount management              | Missing | `Order.discount` exists but is always zero. Add coupon model/rules, admin CRUD, server-side quote validation, usage limits, scopes, scheduling, and discount breakdown.                                                               |
| Advanced product filtering and search       | Partial | Existing keyword/category/sort/pagination. Add price, brand, tags, rating, stock, sale/facets, URL-synced filters, autocomplete, and a relevance search index.                                                                        |
| Inventory and stock movement management     | Partial | Stock decrement/restock exists. Add an inventory movement ledger, adjustment endpoints, reservations, reorder points, movement history, and transaction-backed stock changes.                                                         |
| Custom delivery charges by location         | Partial | Settings zones exist but use name regex. Add structured district/zone mapping, per-zone fees, ETA, COD eligibility, free-shipping overrides, and a public delivery quote endpoint.                                                    |
| Order cancellation, returns, refunds        | Partial | Statuses and payment `REFUNDED` exist. Add an order state machine, request reasons/evidence, refund amounts, return shipping, approval workflow, stock rules, and audit fields.                                                       |
| Invoice and packing slip generation         | Missing | Add legal company settings, invoice numbering, print-optimized web views and/or PDF endpoints; use existing order item snapshots.                                                                                                     |
| Homepage banners and promotional management | Partial | Hero carousel supports active/scheduled slides; side offers use admin-selected featured categories; delivery benefits are editable in settings. Audience rules and reusable placements remain future work.                            |
| Flash sales and scheduled discounts         | Partial | Variant-level flash price/start/end fields, active-sale filtering, real countdown UI, and a shared server-side effective-price resolver are implemented. Separate campaign documents, limits, and coupon stacking remain missing.     |
| Customer management                         | Missing | Add customer admin list/detail, orders, lifetime value, tags/notes, status, and account linkage.                                                                                                                                      |
| Abandoned cart tracking                     | Missing | Add server-side cart identity, TTL, recovery token/contact capture, scheduled scan, notification outbox, and opt-in recovery preferences.                                                                                             |
| SEO and social sharing optimization         | Partial | Static metadata and product SEO field collection exist. Add route metadata, canonical URLs, Open Graph/Twitter cards, product JSON-LD, sitemap/robots, and render product SEO.                                                        |
| Meta Pixel integration readiness            | Missing | Add public pixel ID in settings, consent state, page-view/purchase/add-to-cart events, server-side event outbox with dedupe IDs, and privacy controls.                                                                                |
| Courier integration readiness               | Partial | Manual courier/tracking fields exist. Add provider adapters, signed webhooks, shipment/label/tracking APIs, tracking events, and status synchronization.                                                                              |

Additional production gaps not explicitly requested but recommended:

- Customer order verification hardening (OTP or equivalent), PII minimization, and rate limits.
- RBAC, audit logging, admin management, password reset, and MFA readiness.
- Notification retry worker and a real WhatsApp sender, or removal of dead WhatsApp configuration.
- Legal/policy/FAQ pages and a working newsletter/social-links presentation.
- Database indexes, migrations, backups, monitoring, and deployment smoke tests.

## 6. Rebranding surface

Full details and placeholders are in `BRAND_CONFIG.md`. Highest-impact locations:

| Area                    | Current business-specific values                                                | Key locations                                                                        |
| ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Brand identity          | Anando Deal, Anando Deal Healthy Foods, nuts tagline, logo                      | `packages/shared/src/index.ts:4-8`, `apps/web/index.html`, header/footer/admin login |
| Package/workspace scope | `@anando-deal/*`, root name `Anando Deal`                                       | all `package.json` files and `vercel.json`                                           |
| Order numbering         | `AD-` prefix and Asia/Dhaka date key                                            | `apps/api/src/modules/orders/order.service.ts:74-91`                                 |
| Money/locale            | BDT, `৳`, `en-BD`                                                               | `packages/shared/src/money.ts`, web formatters                                       |
| Contact                 | Support phone, WhatsApp, email, social URLs                                     | shared constants, settings examples, seed, web settings                              |
| Delivery                | Bangladesh districts, Dhaka/inside/outside logic, thresholds                    | `apps/web/src/lib/districts.ts`, `settings.service.ts`, seed                         |
| Payments/couriers       | bKash, Pathao/Steadfast/RedX                                                    | shared enums, checkout, email, admin order detail                                    |
| Colors/assets           | Green/cream/gold theme, Cloudinary cloud/folders, favicon                       | `apps/web/src/index.css`, `index.html`, shared gradients, Cloudinary service         |
| SEO/content             | Static title/description, hero copy, seed products/categories                   | `index.html`, shared defaults, seed, home/shop/admin forms                           |
| Infrastructure names    | DB names, Docker container/volume, JWT issuer/audience, cookies, logger service | env examples, docker compose, auth utilities, logger                                 |
| Tests/docs              | Anando Deal literals, `{prefix}-test` database, sample catalog                  | tests, README                                                                        |

## 7. Bugs, security issues, and incomplete features

### P0 — resolve before feature expansion or public launch

1. **Order access exposes PII.** Order number plus phone returns full customer data, and phone is placed in URLs/logs.  
   `apps/api/src/modules/orders/order.routes.ts:33-41`, `apps/web/src/pages/track.tsx:24-26`, `apps/web/src/pages/order.tsx:57-62`, `apps/api/src/app.ts:35-37`.

2. **Stock can be restored after an order is persisted.** Post-create link accounting failures enter the same compensation path as order creation failures.  
   `apps/api/src/modules/orders/order.service.ts:289-340`.

3. **No database transactions.** Stock, order, counters, and link metrics are separate writes with manual compensation.  
   `order.service.ts:263-341`, `apps/api/src/modules/orders/order-admin.service.ts:139-241`.

4. **Optimistic concurrency is disabled on every model.** Concurrent admin updates can overwrite each other, including stock-affecting status changes.  
   `versionKey: false` in all model schemas.

5. **SKU uniqueness is application-only.** A unique multikey index is absent; order items reference SKU strings.  
   `apps/api/src/models/product.ts:12-22`, `apps/api/src/modules/products/product.service.ts:76-97`.

6. **Admin roles are never enforced.** Any authenticated admin can change settings, payments, and other sensitive resources.  
   `apps/api/src/middleware/require-auth.ts:24-40`, `apps/api/src/utils/app-error.ts:22-24`.

7. **Vercel rewrite may collapse all API paths to `/api`.** This needs deployment verification before launch.  
   `vercel.json:13-17`, `apps/api/src/app.ts:39-48`.

8. **`BKASH_PGW` is accepted without a gateway, callback, or signature verification.** Hide it until implemented.  
   `packages/shared/src/index.ts:55-62,114-129`, `order.service.ts:297-299`.

### P1 — resolve during hardening phases

1. Web admin never calls the existing refresh endpoint; sessions silently expire after 15 minutes.
2. Rate limiting exists only on login and uses an in-memory store unsuitable for serverless/multi-instance deployment.
3. Test email accepts arbitrary recipients without its own rate limit or owner-only role check.
4. Uploads trust client MIME type and never delete replaced Cloudinary assets.
5. Order state transitions are unrestricted and can repeatedly restock/take stock.
6. Dashboard date boundaries mix local time and Asia/Dhaka; revenue/refund/discount accounting is incomplete.
7. Product SEO collected in admin is not loaded on edit or applied to pages.
8. Campaign links ignore configured destination, and UTM data is not captured end to end.
9. Notification retry fields and `node-cron` are unused; WhatsApp configuration has no sender.
10. Health always returns 200 when degraded.
11. Settings updates using nested `$set` can erase sibling fields.
12. Slug collisions can return 500 because probe-then-create does not retry E11000.

### P2 — quality and maintainability

1. No frontend or shared-package tests; API tests are happy-path heavy and exclude untested modules.
2. Tests use brand-specific literals, can drop a misconfigured database, and may leak local email/delivery env vars.
3. `npm test` does not build shared first; tests can use stale `dist`.
4. Tests are excluded from API typecheck.
5. Duplicate date formatters, delivery estimation, escape helpers, and stock loops increase drift.
6. No global React error boundary, skip link, reduced-motion support, focus-trapped drawers, or carousel pause control.
7. Cart stores prices/stock snapshots without checkout revalidation and has no persisted-state migration.
8. Aggressive major dependency versions should be pinned and audited; the baseline `npm ci` reports 9 moderate vulnerabilities.
9. `pino-http` is unused; `node-cron` is installed but not used.
10. No documented backup/restore, migration, observability, or incident procedure.
11. A copied `node_modules` can contain an empty `node_modules/@anando-deal/shared` directory, causing `TS2307` until `npm ci` recreates workspace links.

## 8. Feature dependencies

```text
Brand/config centralization
  ├── all UI copy, defaults, prefixes, colors, SEO
  └── tests stop depending on scattered literals

Security/reliability baseline
  ├── customer accounts and customer-facing order access
  ├── payments/refunds
  └── all write-heavy new modules

Customer identity
  ├── wishlist
  ├── reviews and verified purchases
  ├── customer CRM
  ├── per-customer coupon limits
  └── abandoned carts

Catalog hardening
  ├── inventory ledger
  │     ├── returns/restock rules
  │     ├── flash-sale stock limits
  │     └── low-stock reports
  ├── advanced search/facets/ratings
  └── variant-aware pricing

Central pricing resolver
  ├── coupons
  ├── flash sales
  ├── delivery quotes
  ├── server-side cart quote/revalidation
  └── invoice totals

Order state machine
  ├── cancellation
  ├── returns/refunds
  ├── courier webhooks
  └── invoices/packing slips

Notification outbox
  ├── order/return notifications
  ├── abandoned carts
  ├── review moderation alerts
  └── notification retries

SEO/metadata
  ├── product SEO fields
  ├── canonical/OG/social sharing
  └── Meta Pixel route events
```

Deliver value in this order: correctness/security → brand/config → catalog/inventory/pricing → customer features → fulfilment/after-sales → growth/analytics → launch polish.

## 9. Implementation phases

Each phase is intentionally small enough to review and revert independently. A phase is not complete until its acceptance criteria pass and the completion log at the end of this document is updated.

### Phase 0 — Discovery and planning — **COMPLETE**

**Tasks**

- Inventory the monorepo, stack, routes, models, components, tests, auth, admin, integrations, and deployment.
- Catalog reusable functionality and missing features.
- Identify branding/config surfaces, bugs, security risks, and incomplete work.
- Prepare this plan, `BRAND_CONFIG.md`, and the README update.

**Expected outcome:** a shared, documented baseline for all later work.  
**Acceptance criteria:** analysis documents exist; no application code or environment secrets changed.

---

### Phase 1 — Confirm brand and configuration decisions — **IN PROGRESS / BLOCKED**

**Status update (2026-11-19):** confirmed values are store name `Anando Deal`, general e-commerce business type, `BDT` currency, primary color `#1463c9`, secondary color `#f2be5c`, payment methods COD/bKash/Nagad, inside/outside Dhaka delivery coverage, logo URL, `AD-` order prefix, and `@anando-deal/*` npm scope. Favicon/OG assets, contact information, social links, and several operational identifiers remain TO BE PROVIDED. Full sign-off is not recorded, so Phase 1 acceptance criteria are not yet met.

**Depends on:** Phase 0 and user-supplied brand information.  
**Tasks**

- Fill every required placeholder in `BRAND_CONFIG.md`.
- Decide market/country, currency, locale, timezone, phone format, and delivery geography.
- Decide legal entity details, contact channels, and social handles.
- Confirm target npm scope, DB names, app title, colors, and logo/favicon assets.
- Approve which existing payment/courier options remain or are renamed.

**Expected outcome:** a single approved source of business truth.  
**Acceptance criteria:** no unresolved `NEW_*`/`{{...}}` values in required sections; product owner sign-off recorded.

---

### Phase 2 — Centralize non-secret brand config

**Depends on:** Phase 1.  
**Tasks**

- Add a shared non-secret brand/config module with typed values.
- Replace hardcoded app name, tagline, logo, currency symbol, locale, colors, and copy in shared/web/API where safe.
- Keep secrets in environment variables; do not overwrite local `.env`.
- Use settings/DB values for merchant-editable fields and shared constants only for immutable defaults.
- Make order prefix configurable without rewriting historical orders.
- Update tests to import constants instead of duplicating literals.

**Expected outcome:** one rebrand surface for normal business changes.  
**Acceptance criteria:** storefront, admin, API responses, emails, seed defaults, order prefix, and docs use approved values; old order numbers remain readable; lint/typecheck/tests/build pass.

---

### Phase 3 — Security and reliability baseline

**Depends on:** Phase 2.  
**Tasks**

- Add role middleware and owner-only settings/test-email rules.
- Add rate limits to tracking, order creation, refresh/logout, mail, links, and webhooks using a deployment-compatible store.
- Harden order lookup: OTP/verified token or minimized response, no phone in URLs, and log scrubbing.
- Wrap stock/order/link writes in MongoDB transactions; move notifications to an outbox.
- Add SKU unique index, concurrency guards, slug-conflict retries, and explicit order state transitions.
- Fix Vercel route preservation, health status codes, refresh interceptor, upload validation, and nested settings updates.

**Expected outcome:** safe foundations for accounts, payments, and write-heavy features.  
**Acceptance criteria:** P0 items closed or formally accepted; regression tests cover rollbacks, RBAC, rate limits, and transition rules; deployed `/api/health` and `/api/products` smoke tests pass.

---

### Phase 4 — Test infrastructure and coverage baseline

**Depends on:** Phase 2; runs in parallel with Phase 3 where safe.  
**Tasks**

- Guard the test DB name and isolate all integration-affecting env vars.
- Verify workspace links after a fresh copy and add dependency audit results to CI.
- Make root `npm test` build shared first; include tests in typechecking.
- Consolidate fixtures and add allowlist response assertions.
- Add coverage tooling with an initial threshold, then raise it incrementally.
- Add tests for links, dashboard, admin orders/categories, uploads, settings email, and deployment handler.
- Add shared schema/money unit tests and web smoke tests.

**Expected outcome:** reliable regression protection before schema expansion.  
**Acceptance criteria:** `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass in CI; test DB guard refuses non-test URIs; coverage report is produced.

---

### Phase 5 — Variant, catalog, and inventory hardening

**Depends on:** Phases 3–4.  
**Tasks**

- Add stable variant identifiers and preserve legacy `variantSku`.
- Add variant barcode, default flag, position, images, low-stock threshold, and SKU history.
- Create `InventoryMovement` ledger and centralized stock adjustment service.
- Replace duplicated stock loops with transaction-backed movement writes.
- Add admin inventory list/detail, adjustment form, movement history, and low-stock report.
- Revalidate cart prices and stock before checkout.

**Expected outcome:** trustworthy product and stock data.  
**Acceptance criteria:** concurrent order tests do not oversell; every stock delta has a movement record; legacy SKU order lines still resolve; stock is restored exactly once on cancellation.

---

### Phase 6 — Delivery zones and server-side pricing

**Depends on:** Phase 5.  
**Tasks**

- Model structured delivery zones keyed by district/area rather than zone-name regex.
- Add `GET /api/settings/delivery-quote` with subtotal, district, and optional area.
- Add a single effective-price resolver for base, variant, compare-at, coupon, and flash-sale prices.
- Add `POST /api/orders/quote` returning subtotal, discount, delivery, and total.
- Preserve legacy `deliveryCharge`, `discount`, and order calculation fields.
- Remove hardcoded frontend fallback charges and threshold copy.

**Expected outcome:** accurate, location-aware totals from one server-side source.  
**Acceptance criteria:** quote and final order totals match; inactive/unknown zones behave explicitly; existing `/api/orders` calls remain compatible.

---

### Phase 7 — Promotions and coupons

**Depends on:** Phase 6.  
**Tasks**

- Add `Coupon` model with percentage/fixed/free-shipping types, scopes, limits, schedule, and usage counters.
- Add admin coupon CRUD with validation and audit fields.
- Validate coupons in the quote and order creation flows; populate the existing `discount` field.
- Add checkout coupon entry with clear invalid/expired/minimum messages.
- Add coupon usage reporting to the dashboard.

**Expected outcome:** controlled discounts with server-side enforcement.  
**Acceptance criteria:** expired/ineligible/limited coupons cannot be applied; concurrent redemption respects limits; historical orders keep their captured discount values.

---

### Phase 8 — Banners, promotions, and flash sales

**Depends on:** Phases 6–7.  
**Tasks**

- Add a `Promotion` model for placements, schedule, audience, image, CTA, and active state.
- Add a `FlashSale` model with sale prices, start/end dates, quantity limits, and sold counts.
- Use the Phase 6 price resolver in catalog lists, product detail, quote, and order creation.
- Replace hardcoded home side offers with promotion data.
- Add countdowns/sale badges to `ProductCard` and product detail.
- Add admin promotion and flash-sale screens.

**Expected outcome:** scheduled merchandising without code edits.  
**Acceptance criteria:** active windows switch automatically; sale stock cannot exceed limits; expired sales never affect final order prices; legacy hero carousel still works.

---

### Phase 9 — Customer accounts and wishlist

**Depends on:** Phases 3–4; uses pricing outputs from Phase 6.  
**Tasks**

- Add `Customer` with phone/email identity, hashed password optional, addresses, status, tags, and verification state.
- Add customer auth endpoints with a separate JWT audience/cookie namespace from admin auth.
- Add account profile, order history, and wishlist pages.
- Add wishlist API with product/variant uniqueness and private ownership checks.
- Preserve guest checkout and add an optional guest-order claim flow.
- Remove PII from order URLs and tie customer orders to an authenticated identity where available.

**Expected outcome:** reusable customer identity without breaking guest buyers.  
**Acceptance criteria:** customers can only access their own data; guest checkout still passes existing tests; wishlist survives login; password reset/verification design is documented.

---

### Phase 10 — Reviews and ratings

**Depends on:** Phase 9 and order ownership.  
**Tasks**

- Add `Review` model with rating, title/body, images, status, verified-purchase flag, and helpful count.
- Enforce one review per customer per product/order where applicable.
- Add aggregate rating/review count to product DTOs additively.
- Add product-page review list/form and admin moderation queue.
- Sanitize/render user content safely and add search facets by rating.

**Expected outcome:** trustworthy social proof with moderation.  
**Acceptance criteria:** only verified/approved reviews are public; ratings recalculate correctly; XSS tests pass; product response shape remains backward compatible.

---

### Phase 11 — Cancellation, returns, refunds, and invoices

**Depends on:** Phases 5–7 and the Phase 3 state machine.  
**Tasks**

- Add customer request endpoints and admin approval workflows for cancellation/returns.
- Record reason, evidence, refund amount/method/reference, return tracking, and stock disposition.
- Emit notifications through the outbox and write complete status history with `changedBy`.
- Add legal company fields to settings and invoice numbering.
- Add print-optimized invoice/packing-slip views or PDF endpoints using order snapshots.
- Add admin Returns and Invoices screens and customer-facing download links where appropriate.

**Expected outcome:** complete after-sales operation and documentation.  
**Acceptance criteria:** no double refunds or duplicate restocks; all transitions are audited; PDFs/print views include correct historical prices and totals; legacy status/payment endpoints still work.

---

### Phase 12 — Fulfilment and courier integration readiness

**Depends on:** Phase 11.  
**Tasks**

- Define a provider-neutral courier adapter interface: create shipment, label, track, cancel.
- Keep existing manual courier fields as a fallback.
- Add signed provider webhooks with replay protection and idempotency.
- Store shipment payloads, label URLs, and tracking events on the order.
- Map provider statuses through the existing order state machine.
- Add webhook failure logging and retry behavior.

**Expected outcome:** provider swaps do not require order-model rewrites.  
**Acceptance criteria:** duplicate webhooks are idempotent; invalid signatures are rejected; manual shipment flow still works; tracking events appear in admin order detail.

---

### Phase 13 — SEO, social sharing, Meta Pixel, and abandoned carts

**Depends on:** Phases 8–10 and notification outbox.  
**Tasks**

- Apply product `seo.title`/`seo.description`, canonical URLs, Open Graph/Twitter tags, and JSON-LD.
- Add sitemap, robots.txt, route-level titles, and social preview images.
- Add Meta Pixel ID config, consent state, page views, and purchase/add-to-cart events.
- Add server-side conversion events with dedupe IDs through the outbox.
- Add server-backed carts, recovery tokens, idle-cart scans, and opt-in recovery messages.
- Add abandoned-cart admin reporting and customer management screens.

**Expected outcome:** discoverability, measurable acquisition, and revenue recovery.  
**Acceptance criteria:** no secrets exposed to the browser; events deduplicate; consent is respected; SEO fields survive product edit; recovery messages require explicit opt-in.

---

### Phase 14 — Production launch readiness

**Depends on:** all previous phases.  
**Tasks**

- Run dependency audit, secret scan, accessibility review, and performance budget checks.
- Verify indexes, migrations, backups, restore drill, and monitoring/alerting.
- Verify production env validation, CORS/cookie topology, HTTPS cookies, and Vercel routing.
- Add deployment smoke tests for health, catalog, admin login/refresh, checkout quote, and webhook health.
- Finalize README, runbooks, legal pages, and rollback procedure.
- Obtain product-owner go-live approval.

**Expected outcome:** safe, repeatable launch.  
**Acceptance criteria:** all P0/P1 findings closed or explicitly accepted; CI is green; staging smoke tests pass; rollback is demonstrated; no actual secrets are committed.

## 10. Database and API change plan

### 10.1 Additive model changes

| Model           | Change                                                                                                                                                 | Compatibility rule                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `Product`       | Add variant `variantId`, `barcode`, `isDefault`, `position`, image, low-stock threshold, SKU history, rating aggregates, brand/attributes, sale fields | Keep `label`, `grams`, `price`, `stock`, `sku`; keep `basePrice`/`totalStock`                      |
| `Order`         | Add `customerId`, `variantId` in items, `couponCode`, discount breakdown, tax, refund subdocument, return IDs, shipment data, attribution/UTM snapshot | Keep `variantSku`, `discount`, `total`, `courier`, `courierTrackingId`, all existing status fields |
| `Settings`      | Add structured delivery zones, analytics, legal/company info, promotion config, courier defaults                                                       | Keep `deliveryZones`, hero carousel, social links, alert fields with existing shapes               |
| New collections | Customer, Wishlist, Review, Coupon, InventoryMovement, Promotion, FlashSale, ReturnRequest, Cart, OutboxEvent, Invoice, AuditLog, WebhookEvent         | Add-only; no existing collection deletion                                                          |
| Indexes         | Unique `variants.sku`, customer email/phone, coupon code, cart token, webhook event ID, relevant compound query indexes                                | Build indexes before relying on them; verify existing duplicates first                             |

### 10.2 New API surface

All new endpoints are additive under `/api` or `/api/admin`:

- Customer: `POST /api/customer/auth/*`, `GET /api/customer/me`, order history.
- Wishlist: `GET/POST/DELETE /api/customer/wishlist`.
- Reviews: `GET/POST /api/products/:slug/reviews`; admin moderation routes.
- Coupons: admin CRUD; `POST /api/orders/quote`.
- Search: extend `/api/products` query parameters and add `facets` additively.
- Inventory: `GET /api/admin/inventory/movements`, `POST /api/admin/inventory/adjust`, low-stock report.
- Delivery: `GET /api/settings/delivery-quote`.
- Returns/refunds: customer request routes plus admin approval routes.
- Invoices: order PDF/packing-slip endpoints and admin invoice list.
- Promotions/flash sales: public active listings plus admin CRUD.
- Carts: `POST/GET/PATCH /api/carts`, recovery endpoint.
- Courier: admin shipment routes plus public signed webhooks mounted before auth.

### 10.3 Compatibility rules

1. Keep all existing paths, methods, HTTP status codes, and response envelopes.
2. Keep list responses as `{ items, pagination }`; keep singular wrappers such as `{ order }`.
3. Add optional fields only; never remove existing keys from serializers.
4. Keep the current admin auth cookie/JWT system isolated from customer auth.
5. Keep guest checkout functional and the existing `createOrderSchema` accepted.
6. Preserve `variantSku` while adding `variantId`.
7. Preserve legacy order numbers during prefix changes.
8. Introduce `/api/v1` only if a breaking change becomes unavoidable; keep `/api` working.

## 11. Testing requirements

### 11.1 Existing commands

```bash
npm ci
npm run build:shared
npm run lint
npm run typecheck
npm test
npm run build
```

Tests currently use `apps/api/tests/setup.ts` and drop the configured test database after the suite. Do not point `MONGODB_URI_TEST` at a production or shared database.

### 11.2 Required test layers

| Layer         | Scope                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Contract/unit | Shared Zod schemas, money formatting, pricing rules, coupon rules, state transitions, courier mapping, brand config |
| Integration   | Every new route, auth/ownership, validation, error codes, database side effects, idempotency                        |
| Concurrency   | Stock decrement, coupon redemption, flash-sale limits, webhook replay, idempotency                                  |
| Frontend      | Forms, filters, cart, checkout quote, route metadata, accessibility/keyboard flows, error/empty/loading states      |
| Notification  | Outbox writes, retry/backoff, failed-provider behavior, PII redaction, no email side effects in normal tests        |
| Security      | RBAC, cookie flags, CSRF decisions, upload content sniffing, rate limits, webhook signatures, XSS                   |
| Deployment    | Vercel routing, DB-unavailable behavior, env validation, health/readiness, smoke tests                              |
| Performance   | Catalog query latency, index use, upload limits, bundle budget                                                      |

Every phase acceptance test must include lint, typecheck, API tests, and build at minimum. Add frontend/shared tests when those scripts are introduced in Phase 4.

## 12. Deployment checklist

- [ ] Approved brand config committed; no unresolved placeholders in customer-facing content.
- [ ] Actual `.env` files untouched; production secrets set only in the hosting platform.
- [ ] JWT secrets generated, at least 32 random characters, and rotated if the copied defaults were ever used.
- [ ] `MONGODB_URI`, `CORS_ORIGIN`, cookie domain/SameSite, and `trust proxy` verified for the hosting topology.
- [ ] Vercel rewrite verified: `/api/health`, `/api/products`, and admin endpoints reach Express intact.
- [ ] MongoDB indexes built; unique SKU/customer/coupon checks run against existing data.
- [ ] Database backup and restore drill completed.
- [ ] Production seed data reviewed; demo products/categories/admins removed or intentionally retained.
- [ ] Cloudinary folder scoped to the new brand/environment; old assets intentionally retained or migrated.
- [ ] Email provider, sender identity, alert recipients, and test email verified.
- [ ] WhatsApp integration either implemented or its configuration/docs removed.
- [ ] Payment methods exposed match enabled providers; `BKASH_PGW` hidden until integrated.
- [ ] Courier credentials and signed webhook endpoints verified; manual fallback available.
- [ ] Meta Pixel ID, consent banner, and server-side events verified without exposing access tokens.
- [ ] Sitemap, robots.txt, canonical host, OG images, and social profiles verified.
- [ ] Health/readiness checks, alerts, request IDs, and failed-notification monitoring active.
- [ ] Rate limiting uses a shared/distributed store.
- [ ] Legal pages (terms, privacy, shipping, returns, refunds) published.
- [ ] Lighthouse/accessibility/performance budgets met.
- [ ] CI green; staging smoke tests and rollback rehearsal passed.
- [ ] Product owner go-live approval recorded.

## 13. Phase completion log

Copy this block under a new heading after each phase:

```markdown
### Phase N — Name — COMPLETE

- Completed tasks:
- Remaining tasks:
- Files modified:
- Tests performed:
- Known issues:
```

### Phase 0 — Discovery and planning — COMPLETE

- **Completed tasks:** inspected all major frontend, backend, shared, test, auth, admin, configuration, and deployment areas; inventoried existing features and reusable code; identified requested-feature gaps, branding surfaces, bugs, security concerns, dependencies, and testing/deployment requirements; prepared the three requested documents.
- **Remaining tasks:** all implementation phases 1–14.
- **Files modified:** `PROJECT_PLAN.md` (created), `BRAND_CONFIG.md` (created), `README.md` (updated).
- **Tests performed:** static repository analysis; `npm run lint` (0 errors, 2 pre-existing React Fast Refresh warnings); `npm ci`, `npm run build:shared`, and `npm run typecheck` (passed after workspace links were recreated). API tests were not run because they connect to and clear a MongoDB database and no application code changed.
- **Known issues:** all P0/P1 findings listed in section 7 remain open; all brand placeholders await user input; `npm ci` reports 9 moderate dependency vulnerabilities; lint reports 2 pre-existing warnings.

### Phase 1 — Confirm brand and configuration decisions — IN PROGRESS / BLOCKED

- **Completed tasks:** recorded all supplied values in `BRAND_CONFIG.md`; replaced template placeholders with explicit CONFIRMED, INFERRED, KEEP EXISTING, TO BE PROVIDED, and DEFERRED statuses; recorded the decision to retain food-specific product fields as optional legacy fields for general e-commerce; documented implementation implications for COD, bKash, Nagad, and Dhaka delivery coverage; recorded partial product-owner sign-off; applied the supplied logo URL, `AD-` order prefix, and `@anando-deal/*` npm scope across source, build output, and docs.
- **Remaining tasks:** supply favicon/OG assets; supply support phone/WhatsApp/email/address and alert recipients; supply social profile URLs; confirm or supply legal entity, tagline, description, production database name, courier providers, seed catalog, exact hero slides, Meta Pixel decision, production/legal URLs, locale/timezone/phone rules; obtain full Phase 1 sign-off.
- **Files modified:** `BRAND_CONFIG.md`; `PROJECT_PLAN.md`.
- **Tests performed:** Prettier check passed for `BRAND_CONFIG.md` and `PROJECT_PLAN.md`; `npm run lint` passed with 0 errors and 2 pre-existing React Fast Refresh warnings; `npm run typecheck` passed for all workspaces after `npm run build:shared`; `npm test` passed (5 files, 18 tests) using a disposable `anando_deal_phase1_test` database; `npm run build` passed for shared, web, and API.
- **Known issues:** Phase 1 acceptance criteria are not met because required values remain TO BE PROVIDED; Nagad is not implemented in the current codebase; bKash online PGW remains unimplemented; Phase 2 must not begin until full sign-off is recorded.

### Storefront redesign and targeted e-commerce gaps — COMPLETE

- **Completed tasks:** rebuilt the homepage with admin-managed hero scheduling, featured-category side promos, delivery benefits, real catalog products, backend search, flash-sale countdowns, stock/price/discount badges, real sales counts, skeletons, empty states, and error states; replaced hardcoded sample categories/links in header, footer, and site banner; added persistent guest wishlist with product-card heart, header count, and `/wishlist` page; wired quick add-to-cart using effective prices; added variant-level flash sale price/start/end fields to shared schemas, API models, catalog responses, and admin product form; added featured categories, delivery benefits, and hero scheduling to settings/admin forms; enforced flash pricing server-side during order creation with real discount totals; kept existing checkout, order tracking, admin, and Mongo-backed APIs intact.
- **Remaining tasks:** customer accounts and server-side wishlist sync; separate campaign documents and per-customer/quantity limits; audience rules and reusable promo placements; favicon/OG assets; Nagad and bKash PGW; full Phase 1 sign-off.
- **Files modified:** `packages/shared/src/index.ts`; `apps/api/src/models/product.ts`; `apps/api/src/models/settings.ts`; `apps/api/src/modules/products/product.service.ts`; `apps/api/src/modules/settings/settings.service.ts`; `apps/api/src/modules/orders/order.service.ts`; `apps/api/tests/catalog.test.ts`; `apps/api/tests/orders.test.ts`; `apps/api/tests/settings.test.ts`; `apps/web/src/pages/home.tsx`; `apps/web/src/pages/wishlist.tsx`; `apps/web/src/App.tsx`; `apps/web/src/components/product-card.tsx`; `apps/web/src/components/search-form.tsx`; `apps/web/src/components/section-heading.tsx`; `apps/web/src/components/offer-carousel.tsx`; `apps/web/src/components/home/*`; `apps/web/src/components/layout/site-header.tsx`; `apps/web/src/components/layout/site-footer.tsx`; `apps/web/src/components/layout/site-layout.tsx`; `apps/web/src/hooks/use-catalog.ts`; `apps/web/src/lib/types.ts`; `apps/web/src/lib/category-icon.ts`; `apps/web/src/pages/admin/settings.tsx`; `apps/web/src/pages/admin/product-form.tsx`; `apps/web/src/stores/wishlist.ts`; `PROJECT_PLAN.md`.
- **Tests performed:** `npm run build:shared`, `npx prettier --check .`, `npm run lint` (0 errors, 2 pre-existing React Fast Refresh warnings), `npm run typecheck`, `npm test` (6 files, 25 tests), `npm run build`, and fresh Vite smoke checks returning `200` for `/`, `/wishlist`, `/shop`, and `/track`.
- **Known issues:** wishlist is device-local until customer accounts exist; flash sales are variant-level rather than first-class campaign documents; social proof uses real order-derived counts only; existing `5173` dev server must be restarted to clear stale modules.
