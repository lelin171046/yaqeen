# Brand Configuration — Anando Deal

> **Purpose:** single source of truth for rebranding decisions.  
> **Status:** Phase 1 partially complete — blocked pending favicon/OG, contact, social, and other unsupplied values.  
> **Decision source:** product-owner input received 2026-11-18 and 2026-11-19.  
> **Business scope:** general e-commerce for all kinds of products; food-specific seed data and copy are ignored and must be replaced.  
> **Security:** never put API keys, tokens, passwords, or production database URIs in this file. Actual `.env` files must not be overwritten.

## Decision status legend

- **CONFIRMED** — supplied by the product owner and approved for planning.
- **INFERRED** — derived from supplied values but still needs explicit confirmation.
- **KEEP EXISTING** — existing value retained for compatibility; confirmation still recommended.
- **TO BE PROVIDED** — required before Phase 1 can be marked complete.
- **NOT YET IMPLEMENTED** — a planning decision that later implementation phases must deliver.

There are no template placeholders left in this file. Every unresolved item uses an explicit status above.

## 1. Confirmed Phase 1 decisions

| Setting                    | Approved value                                                                                                              | Status    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------- |
| Store name                 | Anando Deal                                                                                                                 | CONFIRMED |
| Business type              | General e-commerce                                                                                                          | CONFIRMED |
| Currency                   | BDT                                                                                                                         | CONFIRMED |
| Primary color              | `#1463c9`                                                                                                                   | CONFIRMED |
| Secondary/accent color     | `#f2be5c`                                                                                                                   | CONFIRMED |
| Payment methods            | COD, bKash, Nagad                                                                                                           | CONFIRMED |
| Delivery coverage          | Inside Dhaka and outside Dhaka                                                                                              | CONFIRMED |
| Logo                       | https://res.cloudinary.com/dcdmktxtz/image/upload/v1795029495/762944462_122125767986775176_6251977437859688810_n_tofy6h.jpg | CONFIRMED |
| Favicon                    | Supplied logo URL is currently used; dedicated icon asset TO BE PROVIDED                                                    | PARTIAL   |
| Contact information        | +880 1770-937260, rabuofficial007@gmail.com                                                                                 | SUPPLIED  |
| Social media links         | WhatsApp supplied; Facebook, Instagram, and others TO BE PROVIDED                                                           | PARTIAL   |
| Product-owner sign-off     | Partial sign-off only; full Phase 1 approval pending missing values                                                         | BLOCKED   |
| Product catalog scope      | General e-commerce; all kinds of products                                                                                   | CONFIRMED |
| Product examples supplied  | Hot water bottle, room heater, winter dress, kids toys, decorative items                                                    | CONFIRMED |
| Food-specific product data | Ignore food copy and seed data; retain legacy fields only for compatibility                                                 | CONFIRMED |

### Implementation implications recorded for later phases

- Existing `COD` support is already present.
- Manual bKash (`BKASH_MANUAL`), Nagad (`NAGAD_MANUAL`), and Rocket (`ROCKET_MANUAL`) send-money options are implemented with server-side transaction ID validation.
- bKash online PGW (`BKASH_PGW`) remains reserved and is not implemented.
- Existing delivery zones are named "Inside Dhaka" and "Outside Dhaka"; they align with the confirmed coverage and should be retained for compatibility until structured zones are introduced.
- The new colors must replace the current green/cream/gold palette only in Phase 2, after remaining visual assets are supplied.
- Logo and favicon must not be guessed or replaced with mock assets.
- Food-specific seed categories, products, hero slides, and marketing copy must be ignored during rebranding.
- General merchandise examples supplied for planning are hot water bottles, room heaters, winter dresses, kids toys, and decorative items.

## 2. Still required before Phase 1 can be marked complete

| #   | Information                         | Status                     | Notes                                                         |
| --- | ----------------------------------- | -------------------------- | ------------------------------------------------------------- |
| 1   | Logo asset                          | SUPPLIED                   | Cloudinary URL applied to shared config and storefront        |
| 2   | Favicon asset                       | TO BE PROVIDED             | URL or repository-ready file                                  |
| 3   | Support phone                       | +880 1770-937260           | Used for customer support and order contact                   |
| 4   | WhatsApp number                     | +880 1770-937260           | Public storefront contact                                     |
| 5   | Support email                       | rabuofficial007@gmail.com  | Customer-facing email                                         |
| 6   | Physical business address           | TO BE PROVIDED             | Required later for invoices and legal pages                   |
| 7   | Alert email recipients              | TO BE PROVIDED             | Server-side only; do not expose publicly                      |
| 8   | bKash merchant number               | TO BE PROVIDED             | Needed for manual bKash checkout                              |
| 9   | Social profile URLs                 | PARTIAL: WhatsApp supplied | Facebook, Instagram, WhatsApp, and any others                 |
| 10  | Legal entity name                   | TO BE PROVIDED             | Required for invoices/legal pages                             |
| 11  | Tagline and store description       | TO BE PROVIDED             | Customer-facing copy                                          |
| 12  | Order prefix                        | `AD-`                      | Existing `YQ-` must remain readable for historical orders     |
| 13  | npm scope/package names             | SUPPLIED                   | `@anando-deal/*` applied across workspaces                    |
| 14  | Database names                      | TO BE PROVIDED             | Production DB configuration must not be overwritten           |
| 15  | Free-delivery threshold             | TO BE CONFIRMED            | Existing value is 2000 BDT                                    |
| 16  | Default delivery charge             | TO BE CONFIRMED            | Existing value is 80 BDT                                      |
| 17  | Courier providers                   | TO BE PROVIDED             | Existing manual providers are Pathao, Steadfast, and RedX     |
| 18  | Seed catalog                        | TO BE PROVIDED             | General categories/products required; examples supplied above |
| 19  | Hero slides                         | TO BE PROVIDED             | Titles, copy, CTAs, and images                                |
| 20  | Meta Pixel ID                       | TO BE PROVIDED             | Or explicitly confirm "not used"                              |
| 21  | Production URL and legal page URLs  | TO BE PROVIDED             | Needed for canonical URLs and policy links                    |
| 22  | Full Phase 1 sign-off               | TO BE PROVIDED             | Explicit approval after all missing values are recorded       |
| 23  | Country/locale/timezone/phone rules | TO BE CONFIRMED            | Bangladesh / `en-BD` / `Asia/Dhaka` / existing regex inferred |

## 3. Corporate and storefront identity

| Setting            | Current value                                                            | Approved target                                                                                  | Status        |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------- |
| Display name       | Anando Deal                                                              | Anando Deal                                                                                      | CONFIRMED     |
| Admin display name | Anando Deal / Anando Deal Admin                                          | Anando Deal / TO BE PROVIDED                                                                     | PARTIAL       |
| Legal entity       | Not configured                                                           | TO BE PROVIDED                                                                                   | BLOCKED       |
| Tagline            | Natural nuts, dry foods and nutrition you can trust.                     | General e-commerce value promise; exact copy TO BE PROVIDED                                      | PARTIAL       |
| Store description  | Premium nuts, dry foods, diet/nutrition products delivered in Bangladesh | All kinds of products, including winter essentials, winter wear, kids toys, and decorative items | INFERRED      |
| Short about text   | Anando Deal means certainty…                                             | General e-commerce about text TO BE PROVIDED                                                     | PARTIAL       |
| Trust/promise copy | The Anando Deal promise and related bullets                              | Product variety, value, and reliable delivery; exact copy TO BE PROVIDED                         | PARTIAL       |
| Country/market     | Bangladesh                                                               | Bangladesh                                                                                       | INFERRED      |
| Language           | Storefront text is English; `lang="en"`                                  | KEEP EXISTING (`en`)                                                                             | KEEP EXISTING |
| Brand voice        | Premium, natural, trust-oriented                                         | Friendly, value-focused, family-friendly e-commerce                                              | INFERRED      |
| Business type      | Nuts, dry foods, diet/nutrition foods                                    | General e-commerce — all kinds of products                                                       | CONFIRMED     |

## 4. Logo, favicon, and visual identity

| Asset/token              | Current value                                               | Approved target                                  | Status        |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------ | ------------- |
| Brand logo URL           | Supplied Cloudinary JPG                                     | Keep supplied Cloudinary JPG                     | CONFIRMED     |
| Admin logo               | Reuses shared brand logo                                    | Keep reusing shared brand logo                   | CONFIRMED     |
| Favicon                  | Supplied logo URL is currently used                         | Dedicated icon asset TO BE PROVIDED              | PARTIAL       |
| Social/OG image          | Not configured                                              | TO BE PROVIDED                                   | BLOCKED       |
| Local SVG mark           | `apps/web/public/Anando Deal-mark.svg` exists but is unused | TO BE PROVIDED or remove intentionally           | BLOCKED       |
| Primary color            | `#1f4d3b` / green oklch tokens                              | `#1463c9`                                        | CONFIRMED     |
| Accent/secondary color   | `#c9a227`, `#D8B25A`                                        | `#f2be5c`                                        | CONFIRMED     |
| Neutral surface color    | `#F7F1E4`                                                   | TO BE PROVIDED                                   | BLOCKED       |
| Legacy warm accent       | `#3b1d0f`, `#8b5e3c`                                        | TO BE PROVIDED or remove from active design      | BLOCKED       |
| Theme color meta         | `#1f4d3b`                                                   | `#1463c9`                                        | CONFIRMED     |
| Hero gradients           | forest/amber/navy/berry/slate hardcoded hexes               | Derive from `#1463c9` and `#f2be5c`; details TBD | PARTIAL       |
| Chart palette            | `#1f4d3b`, `#c9a227`, etc.                                  | Derive from confirmed colors; details TBD        | PARTIAL       |
| Placeholder image colors | `f3ede0/1f4d3b` in seed images                              | TO BE PROVIDED                                   | BLOCKED       |
| Display font             | Fraunces                                                    | KEEP EXISTING                                    | KEEP EXISTING |
| Body font                | Inter                                                       | KEEP EXISTING                                    | KEEP EXISTING |

### Current hardcoded visual locations

- `apps/web/src/index.css:6-81` — theme tokens and light/dark palettes.
- `apps/web/index.html:5,11,14-18` — favicon, theme color, fonts, title.
- `apps/web/src/pages/home.tsx:68-75,138-153` — category tones and hardcoded side-offer gradients.
- `apps/web/src/pages/admin/dashboard.tsx:53,193-194,227` — chart colors.
- `apps/web/src/components/admin/ui.tsx:28-34,69-81` — tone/status colors.
- `packages/shared/src/index.ts:312-339` — hero theme labels and gradients.
- `apps/api/src/scripts/seed.ts:12-13` — placeholder image URL colors.

## 5. Contact information and social links

| Setting                | Current value                                          | Approved target             | Status   | Where it appears                                               |
| ---------------------- | ------------------------------------------------------ | --------------------------- | -------- | -------------------------------------------------------------- |
| Support phone          | existing phone number in shared/seed/settings examples | +880 1770-937260            | SUPPLIED | shared constants, seed, admin settings, web examples           |
| WhatsApp number        | same business number                                   | +880 1770-937260            | SUPPLIED | shared constant, env examples, seed, header/footer/order/admin |
| Support email          | hello@anandodeal.com placeholder in admin UI           | rabuofficial007@gmail.com   | SUPPLIED | admin settings defaults, support mail, storefront              |
| Alert emails           | owner@anandodeal.com, ops@anandodeal.com placeholders  | TO BE PROVIDED              | BLOCKED  | admin settings, env                                            |
| bKash merchant number  | 01XXXXXXXXX template                                   | TO BE PROVIDED              | BLOCKED  | env, settings, checkout                                        |
| Nagad merchant number  | Not configured                                         | TO BE PROVIDED              | BLOCKED  | env, settings, checkout                                        |
| Rocket merchant number | Not configured                                         | TO BE PROVIDED              | BLOCKED  | env, settings, checkout                                        |
| Facebook               | https://facebook.com/Anando Deal placeholder           | TO BE PROVIDED              | BLOCKED  | settings defaults                                              |
| Instagram              | https://instagram.com/Anando Deal placeholder          | TO BE PROVIDED              | BLOCKED  | settings defaults                                              |
| WhatsApp link          | https://wa.me/...                                      | https://wa.me/8801770937260 | SUPPLIED | settings/seed/web helper                                       |
| TikTok/YouTube/X       | Not configured                                         | TO BE PROVIDED              | BLOCKED  | settings schema extension may be required                      |
| Business address       | Not configured                                         | TO BE PROVIDED              | BLOCKED  | invoices, legal pages, settings                                |

Admin-configured social links currently exist in settings but are not rendered in the storefront footer. Rendering remains planned for the SEO/social phase.

## 6. Money, locale, and geography

| Setting                 | Current value                                        | Approved target                                   | Status        |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------- | ------------- |
| Currency code           | BDT                                                  | BDT                                               | CONFIRMED     |
| Currency symbol         | ৳                                                    | KEEP EXISTING (৳)                                 | KEEP EXISTING |
| Number locale           | en-BD                                                | KEEP EXISTING (en-BD)                             | KEEP EXISTING |
| Date/time locale        | en-BD, en-CA used internally                         | KEEP EXISTING                                     | KEEP EXISTING |
| Timezone                | Asia/Dhaka                                           | KEEP EXISTING (Asia/Dhaka)                        | KEEP EXISTING |
| Phone validator         | Bangladeshi mobile regex                             | KEEP EXISTING pending confirmation                | KEEP EXISTING |
| Phone normalization     | strips separators, handles 880/leading 1             | KEEP EXISTING                                     | KEEP EXISTING |
| Country                 | Bangladesh                                           | Bangladesh                                        | INFERRED      |
| District list           | 64 hardcoded Bangladesh districts                    | Keep current list for Dhaka delivery coverage     | KEEP EXISTING |
| Free-delivery threshold | 2000                                                 | KEEP EXISTING (2000 BDT) pending confirmation     | KEEP EXISTING |
| Default delivery charge | 80                                                   | KEEP EXISTING (80 BDT) pending confirmation       | KEEP EXISTING |
| Current zones           | Inside Dhaka 60, Outside Dhaka 120                   | Inside Dhaka and Outside Dhaka; amounts TBD       | PARTIAL       |
| Zone matching           | regex on names inside/outside, literal dhaka         | Keep during compatibility; restructure in Phase 6 | KEEP EXISTING |
| Delivery promise copy   | Free delivery across Bangladesh, Nationwide delivery | Inside and outside Dhaka; final copy TBD          | PARTIAL       |
| COD availability        | Nationwide                                           | Inside and outside Dhaka pending final rules      | PARTIAL       |

## 7. Order, payment, and fulfilment configuration

| Setting                | Current value                                             | Approved target                                         | Status        |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------- | ------------- |
| Order number format    | AD-YYMMDD-####                                            | `AD-` confirmed by rebrand; keep historical YQ readable | CONFIRMED     |
| Counter key            | order-dateKey                                             | KEEP EXISTING                                           | KEEP EXISTING |
| Initial order status   | PENDING                                                   | KEEP EXISTING                                           | KEEP EXISTING |
| Initial payment status | UNPAID                                                    | KEEP EXISTING                                           | KEEP EXISTING |
| Payment methods        | COD, BKASH_MANUAL, NAGAD_MANUAL, ROCKET_MANUAL, BKASH_PGW | COD, bKash, Nagad, Rocket send-money methods            | CONFIRMED     |
| Payment labels         | Cash on delivery, bKash/Nagad/Rocket send money           | COD, bKash, Nagad, Rocket                               | CONFIRMED     |
| Order statuses         | 8 current statuses/labels                                 | KEEP EXISTING                                           | KEEP EXISTING |
| Courier providers      | Pathao, Steadfast, RedX                                   | TO BE PROVIDED                                          | BLOCKED       |
| Courier behavior       | manual name + tracking ID on SHIPPED                      | KEEP EXISTING until provider decisions are supplied     | KEEP EXISTING |
| Low-stock threshold    | 5                                                         | KEEP EXISTING                                           | KEEP EXISTING |
| Order limits           | 1–20 lines, quantity 1–50                                 | KEEP EXISTING                                           | KEEP EXISTING |
| Return window          | Not configured                                            | TO BE PROVIDED                                          | BLOCKED       |
| Cancellation rules     | Not configured                                            | TO BE PROVIDED                                          | BLOCKED       |
| Refund methods         | REFUNDED status only                                      | TO BE PROVIDED                                          | BLOCKED       |
| Invoice legal footer   | Not configured                                            | TO BE PROVIDED                                          | BLOCKED       |
| Tax/VAT registration   | Not configured                                            | TO BE PROVIDED                                          | BLOCKED       |

Historical order numbers using the old prefix must remain valid; do not mutate existing order documents during rebranding.

## 8. SEO and social sharing

| Setting                            | Current value                                      | Approved target                                                                                                | Status        |
| ---------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------- |
| HTML title                         | Anando Deal — All Kinds of Products                | Anando Deal — All Kinds of Products                                                                            | INFERRED      |
| Meta description                   | Anando Deal nuts/dry foods Bangladesh description  | All kinds of products in Bangladesh, including winter essentials, winter wear, kids toys, and decorative items | INFERRED      |
| Canonical URL                      | Missing                                            | TO BE PROVIDED                                                                                                 | BLOCKED       |
| Open Graph title/description/image | Missing                                            | TO BE PROVIDED                                                                                                 | BLOCKED       |
| Twitter card                       | Missing                                            | TO BE PROVIDED                                                                                                 | BLOCKED       |
| Robots/sitemap                     | Missing                                            | Generate during implementation                                                                                 | DEFERRED      |
| Product SEO                        | Fields collected but not applied or loaded on edit | Apply in SEO phase                                                                                             | DEFERRED      |
| Structured data                    | Missing                                            | Organization, WebSite, Product, BreadcrumbList                                                                 | DEFERRED      |
| HTML language                      | en                                                 | KEEP EXISTING (en)                                                                                             | KEEP EXISTING |

## 9. Analytics, notifications, and integrations

| Integration                      | Current state                                     | Approved decision                                                | Status        |
| -------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ------------- |
| Meta Pixel                       | Not implemented                                   | TO BE PROVIDED or confirm "not used"                             | BLOCKED       |
| Google Analytics/other analytics | Not implemented                                   | TO BE PROVIDED                                                   | BLOCKED       |
| Email provider                   | Resend or SMTP supported by env                   | KEEP EXISTING provider support; sender/recipients TO BE PROVIDED | PARTIAL       |
| WhatsApp seller alerts           | Configuration and log type exist; sender missing  | Decide later: implement or remove dead config                    | DEFERRED      |
| Cloudinary                       | Cloud name currently in examples/logo URL/folders | KEEP EXISTING credentials; new folders/branding later            | KEEP EXISTING |
| Payment gateway                  | bKash PGW reserved only                           | COD + manual bKash now; Nagad and any PGW later                  | CONFIRMED     |
| Courier APIs                     | Manual fields only                                | TO BE PROVIDED                                                   | BLOCKED       |
| Newsletter                       | Copy exists; no implementation                    | TO BE PROVIDED                                                   | BLOCKED       |

Keep public identifiers such as a Meta Pixel ID in public settings if intended for client use. Keep access tokens, API keys, and secrets only in environment variables or an admin-only server-side configuration.

## 10. Technical identifiers and infrastructure names

| Identifier           | Current value                                           | Approved target                                         | Status        |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ------------- |
| Root package name    | Anando Deal                                             | TO BE PROVIDED                                          | BLOCKED       |
| Workspace scope      | @anando-deal/web, @anando-deal/api, @anando-deal/shared | @anando-deal/web, @anando-deal/api, @anando-deal/shared | CONFIRMED     |
| Root description     | Anando Deal e-commerce description                      | Anando Deal general e-commerce                          | PARTIAL       |
| MongoDB dev DB       | Anando Deal                                             | KEEP EXISTING until owner supplies value                | KEEP EXISTING |
| MongoDB test DB      | anando_deal_test                                        | KEEP EXISTING until owner supplies value                | KEEP EXISTING |
| Docker container     | anando-deal-mongo                                       | TO BE PROVIDED                                          | BLOCKED       |
| Docker volume        | anando-deal-mongo-data                                  | TO BE PROVIDED                                          | BLOCKED       |
| Logger service       | anando-deal-api                                         | TO BE PROVIDED                                          | BLOCKED       |
| API root name        | Anando Deal API                                         | Anando Deal API                                         | CONFIRMED     |
| JWT issuer           | anando-deal-api                                         | TO BE PROVIDED; changing invalidates sessions           | BLOCKED       |
| JWT audience         | anando-deal-admin                                       | TO BE PROVIDED; changing invalidates sessions           | BLOCKED       |
| Access cookie        | anando_deal_access                                      | TO BE PROVIDED; changing invalidates sessions           | BLOCKED       |
| Refresh cookie       | anando_deal_refresh                                     | TO BE PROVIDED; changing invalidates sessions           | BLOCKED       |
| Cloudinary folders   | anando-deal/products, anando-deal/products/videos       | TO BE PROVIDED                                          | BLOCKED       |
| Serverless cache key | \_\_anandoDealMongoose                                  | TO BE PROVIDED                                          | BLOCKED       |
| Cart storage key     | anando-deal-cart                                        | TO BE PROVIDED                                          | BLOCKED       |
| Campaign storage key | anando-deal:link                                        | TO BE PROVIDED                                          | BLOCKED       |
| WhatsApp template    | new_order_alert                                         | KEEP EXISTING unless provider requires a new template   | KEEP EXISTING |
| Seed admin identity  | Anando Deal-branded example defaults                    | TO BE PROVIDED                                          | BLOCKED       |

Changing cookie names, JWT issuer/audience, or database names invalidates existing sessions or points to a different dataset. Coordinate cutover and migration; never change production values blindly.

## 11. Seed data and demonstration content

The seed currently creates six food categories and six nut/dry-food products with variants, badges, nutrition data, tags, and marketing copy. This food catalog is legacy demonstration data and must be ignored, not extended.

### General e-commerce target catalog

| Target category     | Example products                                    | Status   |
| ------------------- | --------------------------------------------------- | -------- |
| Winter Essentials   | Hot water bottles, room heaters, blankets           | INFERRED |
| Winter Fashion      | Winter dresses, jackets, sweaters, shawls           | INFERRED |
| Kids & Toys         | Kids toys, games, kids clothing, learning toys      | INFERRED |
| Home & Decorative   | Decorative items, wall art, lights, vases, cushions | INFERRED |
| General Merchandise | Other all-season products as the catalog grows      | INFERRED |

The supplied product examples are confirmed. The category grouping above is an inferred planning starting point; exact category names, product list, prices, SKUs, images, and SEO copy remain TO BE PROVIDED.

Current default hero slides:

1. fresh-nuts — nuts/seeds/dry-fruits copy and /shop?category=nuts-seeds.
2. gift-boxes — gift-box copy and /shop?category=gift-boxes.
3. free-delivery — free delivery over ৳2,000, nationwide/COD copy.

Target slides must promote general e-commerce themes and may include winter essentials, winter fashion, kids toys, and home decor. Exact titles, copy, CTAs, and images are TO BE PROVIDED.

Current admin examples to replace include Eid cashew campaign, eid-cashew, Facebook – Eid 2026, CASHEW-250G, cashew form helper text, and food-specific category examples.

## 12. File-by-file rebrand checklist

### Documentation/configuration

- `README.md` — title, description, DB names, workspace commands, payment copy, order prefix, phase notes.
- `package.json` — root name, description, all workspace script references.
- `apps/web/package.json`, `apps/api/package.json`, `packages/shared/package.json` — package names/dependencies.
- `vercel.json` — workspace build commands.
- `docker-compose.yml` — container and volume names.
- `apps/api/.env.example`, `apps/web/.env.example` — non-secret examples only; never edit actual `.env`.
- `api/index.ts` — serverless Mongoose cache key.

### Shared package

- `packages/shared/src/index.ts:4-12` — name, tagline, logo, WhatsApp, currency.
- `packages/shared/src/index.ts:14-68` — status/courier/payment/source labels.
- `packages/shared/src/index.ts:75-83` — phone validation.
- `packages/shared/src/index.ts:237-267` — legacy food-specific fields; hide/ignore them in general e-commerce UI.
- `packages/shared/src/index.ts:312-426` — hero themes and default slides.
- `packages/shared/src/index.ts:428-457` — settings fields and payment/social defaults.
- `packages/shared/src/money.ts:1-17` — currency/locale/formatter terminology.

### API

- `apps/api/src/app.ts`, `server.ts`, `config/logger.ts` — API/service names.
- `apps/api/src/config/env.ts` — defaults, admin seed identity, currency-related defaults.
- `apps/api/src/utils/tokens.ts`, `auth-cookies.ts` — issuer, audience, cookie names.
- `apps/api/src/services/cloudinary.ts` — upload folders.
- `apps/api/src/services/order-notifications.ts`, `modules/settings/settings.routes.ts` — email subject/body/copy.
- `apps/api/src/modules/orders/order.service.ts:74-91` — date timezone and order prefix.
- `apps/api/src/modules/settings/settings.service.ts` — fallback name and delivery matching.
- `apps/api/src/scripts/seed.ts` — general e-commerce categories/products, settings, admin identity, contact data.
- `apps/api/src/modules/dashboard/dashboard.service.ts` — timezone/date bucketing.

### Web

- `apps/web/index.html` — title, description, favicon, theme color, language, fonts.
- `apps/web/src/index.css` — color tokens and gradients.
- `apps/web/src/components/layout/*` — logo, name, WhatsApp text, footer copy/links, delivery promise.
- `apps/web/src/components/admin/admin-layout.tsx`, `pages/admin/login.tsx` — admin brand and credential copy.
- `apps/web/src/pages/home.tsx`, `shop.tsx`, `product.tsx`, `order.tsx`, `checkout.tsx` — brand/category/location/payment copy.
- `apps/web/src/pages/admin/settings.tsx`, `links.tsx`, `categories.tsx`, `product-form.tsx` — defaults and examples.
- `apps/web/src/stores/cart.ts`, `pages/checkout.tsx`, `pages/link-redirect.tsx` — storage keys.
- `apps/web/src/lib/districts.ts`, `whatsapp.ts` — geography and contact defaults.
- `apps/web/src/vite-env.d.ts` — public env variable contract.

### Tests

- `apps/api/tests/setup.ts` — test database name.
- `apps/api/tests/helpers.ts` — seeded admin name/email.
- `apps/api/tests/catalog.test.ts` — category/product fixtures, slugs, SKUs, search terms.
- `apps/api/tests/orders.test.ts` — customer/location fixtures, order prefix, store-name assertion, payment/courier cases.
- `apps/api/tests/settings.test.ts` — hero-slide copy and category links.
- `apps/api/tests/auth.test.ts` — seeded admin display name.

### Domain-specific model decision

Because the approved business type is general e-commerce, food-specific copy and seed data are ignored. Existing `ingredients`, `nutrition`, and `grams` fields may remain in the database schema only for backward compatibility; hide them from new product forms and storefront presentation. General product attributes such as brand, size, color, material, age group, and season can be planned in a later phase.

## 13. Filled worksheet — Phase 1 working values

```text
NEW_STORE_NAME = Anando Deal
BUSINESS_TYPE = General e-commerce — all kinds of products (CONFIRMED)
LEGAL_ENTITY_NAME = TO BE PROVIDED
NEW_TAGLINE = TO BE PROVIDED
NEW_STORE_DESCRIPTION = General e-commerce store selling all kinds of products, including winter essentials, winter wear, kids toys, and decorative items (INFERRED; exact copy TO BE PROVIDED)
MARKET_COUNTRY = Bangladesh (INFERRED, pending confirmation)
CURRENCY_CODE = BDT
CURRENCY_SYMBOL = KEEP EXISTING (৳, pending confirmation)
LOCALE = KEEP EXISTING (en-BD, pending confirmation)
TIMEZONE = KEEP EXISTING (Asia/Dhaka, pending confirmation)
PHONE_REGEX = KEEP EXISTING (Bangladeshi mobile regex, pending confirmation)
ORDER_PREFIX = AD- (CONFIRMED and applied)
SUPPORT_PHONE = +880 1770-937260
WHATSAPP_NUMBER = +880 1770-937260
SUPPORT_EMAIL = rabuofficial007@gmail.com
BUSINESS_ADDRESS = TO BE PROVIDED
LOGO_URL = https://res.cloudinary.com/dcdmktxtz/image/upload/v1795029495/762944462_122125767986775176_6251977437859688810_n_tofy6h.jpg
FAVICON_URL = TO BE PROVIDED
OG_IMAGE_URL = TO BE PROVIDED
PRIMARY_COLOR = #1463c9
ACCENT_COLOR = #f2be5c (supplied as secondary color)
SURFACE_COLOR = TO BE PROVIDED
PRODUCTION_URL = TO BE PROVIDED
FACEBOOK_URL = TO BE PROVIDED
INSTAGRAM_URL = TO BE PROVIDED
WHATSAPP_URL = https://wa.me/8801770937260
PAYMENT_METHODS = COD, bKash (send money), Nagad (send money), Rocket (send money)
COURIER_PROVIDERS = TO BE PROVIDED
DELIVERY_AREAS_AND_RULES = Inside Dhaka, Outside Dhaka
FREE_DELIVERY_THRESHOLD = KEEP EXISTING (2000 BDT, pending confirmation)
DEFAULT_DELIVERY_CHARGE = KEEP EXISTING (80 BDT, pending confirmation)
NPM_SCOPE = TO BE PROVIDED
MONGO_DB_NAME = KEEP EXISTING for development; production DB untouched
TEST_DB_NAME = KEEP EXISTING until owner supplies value
META_PIXEL_ID = TO BE PROVIDED or confirm not used
SEED_CATALOG = General merchandise catalog; supplied examples: hot water bottle, room heater, winter dress, kids toys, decorative items; exact list TO BE PROVIDED
HERO_SLIDES = TO BE PROVIDED
TERMS_URL = TO BE PROVIDED
PRIVACY_URL = TO BE PROVIDED
SHIPPING_URL = TO BE PROVIDED
RETURNS_URL = TO BE PROVIDED
```

## 14. Sign-off record

- **2026-11-18:** product owner supplied store name, business type, currency, primary/secondary colors, payment methods, and delivery coverage.
- **2026-11-18:** product owner marked logo, favicon, contact information, and social media links as "To be provided."
- **2026-11-19:** product owner confirmed the site is a general e-commerce store for all kinds of products, supplied examples including hot water bottles, room heaters, winter dresses, kids toys, and decorative items, and instructed that food-specific sections be ignored.
- **Full Phase 1 sign-off:** not recorded. Phase 1 remains blocked until the values in section 2 are supplied and explicitly approved.
