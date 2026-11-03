# Yaqeen

Premium nuts, dry foods, diet foods and nutritional foods — an e-commerce store for Bangladesh with cash on delivery, bKash, and Facebook ad order links.

## Stack

- **Web:** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, TanStack Query, Zustand
- **API:** Node.js, Express 5, Mongoose, Zod, JWT
- **Database:** MongoDB (Atlas or local)
- **Integrations:** WhatsApp Cloud API, email (Resend/SMTP), Cloudinary, bKash

## Monorepo layout

```
apps/web        React storefront + admin dashboard
apps/api        Express API
packages/shared Zod schemas, types, constants
```

## Requirements

- Node.js 24+ (26 LTS recommended)
- npm 11+
- MongoDB (Atlas recommended). Docker is optional.

## Setup

```bash
npm install
```

Create local environment files:

```bash
# Windows PowerShell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Add your `MONGODB_URI` in `apps/api/.env`. The API will still start without it, but database-backed features will not work.

Run both apps:

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000
- Health: http://localhost:4000/api/health
- Shop: http://localhost:5173/shop

Or run them separately:

```bash
npm run dev:web
npm run dev:api
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Build shared package, then run web + API |
| `npm run dev:web` | Run the Vite dev server |
| `npm run dev:api` | Run the API with hot reload |
| `npm run build` | Build shared, web, and API |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm test` | Run API tests |
| `npm run seed -w @yaqeen/api` | Seed categories, products, settings and admin |
| `npm run format` | Format with Prettier |

## MongoDB

Use MongoDB Atlas for the fastest production setup. For local development, any of these work:

```bash
# Installed MongoDB service (current Windows setup)
# Make sure the MongoDB service is running, then use:
MONGODB_URI=mongodb://127.0.0.1:27017/yaqeen

# Or Docker
docker compose up -d
```

Seed categories, sample products, store settings and the first admin:

```bash
npm run seed -w @yaqeen/api
```

The seed reads `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `apps/api/.env`. In development, if `ADMIN_PASSWORD` is unset it falls back to `ChangeMe123!`; change it before going live.

API tests use a separate database (`yaqeen_test` by default, override with `MONGODB_URI_TEST`). CI starts a MongoDB service automatically.

## Payments

The order model supports:

- `COD` — cash on delivery (available now)
- `BKASH_MANUAL` — buyer sends money to the merchant number and submits the TrxID (available now)
- `BKASH_PGW` — bKash online payment (reserved for gateway integration)

Manual bKash payments are only marked paid after admin verification. Never store PINs, OTPs, or card data.

## Storefront and checkout

Public pages:

| Route | Purpose |
| --- | --- |
| `/shop` | Catalog with search, category filter, sort and pagination |
| `/product/:slug` | Product detail with size selection and cart |
| `/checkout` | Guest checkout with COD or manual bKash |
| `/order/:orderNumber?phone=...` | Order confirmation and status tracking |
| `/track` | Look up an order with order number + phone |
| `/l/:code` | Facebook/campaign link redirect with click tracking |

Orders are validated against live stock, stock is decremented atomically, and order
numbers use a daily sequence (`YQ-YYMMDD-####`). Manual bKash orders stay `UNPAID`
until the seller verifies the TrxID. The cart is stored locally in the browser.
Campaign links set a first-touch `source.linkCode` on orders placed in the same session.

## Admin dashboard

Sign in at `/admin/login` with the seeded admin account. The dashboard (`/admin`)
includes revenue and order KPIs, a sales chart, status/payment breakdowns, top products,
low-stock alerts, recent orders, campaign performance, product and category management,
order status/payment/notes updates, ad-link management and store settings.

## Media uploads

Product images (max 5 MB) and videos (max 50 MB) are uploaded to Cloudinary through
`POST /api/admin/uploads/image` and `POST /api/admin/uploads/video` (multipart field:
`file`). Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
`CLOUDINARY_API_SECRET` to enable them; until then the endpoints return
`503 UPLOAD_NOT_CONFIGURED`. You can also pass image or video URLs directly when
creating a product.

## Phase status

- [x] Phase 1: Monorepo, tooling, API foundation, design system, landing page
- [x] Phase 2: Models, admin auth, product and category management, uploads
- [x] Phase 3: Storefront, order landing page, guest checkout
- [ ] Phase 4: Ad links and click tracking done; WhatsApp/email notifications pending
- [x] Phase 5: Admin dashboard, links, analytics, settings
- [ ] Phase 6: Polish, SEO, accessibility, performance
- [ ] Phase 7: Deployment and launch
