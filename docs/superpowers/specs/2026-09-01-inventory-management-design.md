# Inventory Management System — Design Spec

**Date:** 2026-09-01
**Status:** Approved for planning

## 1. Purpose

Build a basic inventory management system for a single-location retail
store. Admins manage the product catalog and stock levels. Staff view
the catalog read-only. Backend and auth are Supabase. Frontend is
Next.js (App Router).

This is v1. It is deliberately narrow: product CRUD plus
role-gated access. Stock movements, suppliers, low-stock alerts,
multi-location, and reporting are out of scope.

## 2. Success criteria

The system is done when:

1. An admin can sign in, create a product, edit it, and delete it.
2. A staff user can sign in and see the product list, but cannot
   create, edit, or delete anything — enforced by RLS, not just UI.
3. Search on the product list filters by name or SKU.
4. New auth users get a `profiles` row with `role='staff'` automatically.
5. The RLS test script passes against the deployed Supabase project.
6. The manual smoke checklist in the README passes end-to-end.

## 3. Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui.
- **Backend + DB + Auth:** Supabase (Postgres, Auth, RLS).
- **Supabase client:** `@supabase/ssr` for cookie-based server auth,
  `@supabase/supabase-js` for the login page browser client.
- **Toasts:** `sonner`.
- **Hosting:** Not specified for v1. Vercel is the default target.

## 4. Data model

Two tables. No `categories` table — category is a plain text column on
`products`. No stock movements — `stock` is edited directly. Both are
intentional simplifications; upgrade paths are noted.

### 4.1 `profiles`

Extends `auth.users` with role and display name.

| Column      | Type          | Notes                                                     |
|-------------|---------------|-----------------------------------------------------------|
| id          | uuid          | PK. FK → `auth.users(id) on delete cascade`.              |
| full_name   | text          | Nullable.                                                 |
| role        | text          | Not null. Default `'staff'`. Check in `('admin','staff')`. |
| created_at  | timestamptz   | Default `now()`.                                          |

### 4.2 `products`

| Column      | Type            | Notes                                              |
|-------------|-----------------|----------------------------------------------------|
| id          | uuid            | PK. Default `gen_random_uuid()`.                   |
| sku         | text            | Unique, not null. Human-readable, e.g. `SKU-001`. |
| name        | text            | Not null.                                          |
| description | text            | Nullable.                                          |
| category    | text            | Nullable. Free text.                               |
| price       | numeric(10,2)   | Not null. Check `>= 0`. Sale price.                |
| cost        | numeric(10,2)   | Nullable. Check `>= 0`. Purchase cost.             |
| stock       | integer         | Not null. Default `0`. Check `>= 0`.               |
| created_at  | timestamptz     | Default `now()`.                                   |
| updated_at  | timestamptz     | Default `now()`. Maintained by trigger.            |

**Indexes:** unique index on `sku` (implicit via UNIQUE). B-tree index on
`category` for filter queries.

### 4.3 Triggers and helper functions

**`handle_new_user()`** — on `auth.users` insert, create a matching
`profiles` row with `role='staff'`. `security definer`.

**`set_updated_at()`** — before update on `products`, set
`updated_at = now()`.

**`is_admin()`** — returns boolean. Reads current user's row in
`profiles`. `security definer`, `stable`, `set search_path = public`.
Used by RLS policies.

## 5. Auth and row-level security

### 5.1 Auth

- Email + password only. No OAuth, no magic link.
- Public signup is **not** exposed in the UI. New staff are invited via
  the Supabase dashboard (or a future admin-only settings page).
- Sessions managed via cookies through `@supabase/ssr`. Middleware
  refreshes the session on every request under `(app)/*`.

### 5.2 Bootstrapping the first admin

After migration is applied and the first user is created through the
Supabase dashboard, promote them by running in the SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<user-uuid>';
```

Documented in `README.md`.

### 5.3 RLS policies

All tables have RLS enabled.

**`profiles`:**

- **Select:** `auth.uid() = id or public.is_admin()`.
- **Update:** `public.is_admin()`. Users cannot self-promote.
- **Insert / delete:** no policy. Insert is handled by the auth
  trigger. Delete cascades from `auth.users`.

**`products`:**

- **Select:** `auth.role() = 'authenticated'` (any signed-in user).
- **Insert / update / delete:** `public.is_admin()`.

Result: staff are read-only on the catalog. Admin has full CRUD.

## 6. App structure

```
inventory-management/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                       redirects → /products or /login
│   ├── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                 nav, role badge, sign-out
│   │   └── products/
│   │       ├── page.tsx               list + search
│   │       ├── actions.ts             createProduct server action
│   │       ├── new/page.tsx           admin-only create form
│   │       └── [id]/
│   │           ├── page.tsx           detail / edit form
│   │           └── actions.ts         updateProduct, deleteProduct
│   └── auth/
│       └── signout/route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  browser client
│   │   ├── server.ts                  server client (cookies)
│   │   └── middleware.ts              session refresh helper
│   └── auth.ts                        getCurrentUser, requireAdmin
├── components/ui/                     shadcn primitives
├── middleware.ts                      gates (app)/*, refreshes session
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql
│   └── tests/
│       └── rls.sql
├── .env.local.example
├── README.md
├── package.json
├── tsconfig.json
└── next.config.ts
```

### 6.1 Supabase client pattern

- **`lib/supabase/server.ts`** — cookie-aware client for server
  components, server actions, and route handlers. Uses `createServerClient`
  from `@supabase/ssr`.
- **`lib/supabase/client.ts`** — browser client for the login form only.
  Uses `createBrowserClient`.
- **`lib/supabase/middleware.ts`** — `updateSession` helper called from
  `middleware.ts` on every matched request.

### 6.2 Middleware behavior

Runs on all routes except static assets. Steps:

1. Refresh the Supabase session via cookies.
2. If the path starts with `/(app)` (i.e. any authenticated route) and
   there is no session, redirect to `/login`.
3. If the path is `/products/new` and the user is not admin, redirect
   to `/products`. (UI hides the button, but middleware is the belt.)

RLS remains the real enforcement; middleware is a UX optimization.

### 6.3 Server actions

Write paths (`createProduct`, `updateProduct`, `deleteProduct`) are
server actions in the relevant `actions.ts` files. Each:

1. Gets the server Supabase client.
2. Calls the DB. RLS enforces admin-only.
3. On success, revalidates `/products` and (for update) `/products/[id]`,
   then returns `{ ok: true }` or redirects.
4. On failure, returns `{ ok: false, error: string }` for the form to
   surface via toast.

## 7. Pages and UI

### 7.1 `/login`

- Centered card. Email + password + submit.
- Uses browser client `signInWithPassword`.
- Errors shown inline; on success, `router.push('/products')`.
- No signup link.

### 7.2 `/products` (list)

- Server component. Reads `?q=` from search params.
- Query: `select * from products where name ilike '%q%' or sku ilike '%q%' order by created_at desc limit 500`.
- Renders shadcn `Table`: SKU, Name, Category, Price, Stock, Actions.
- Top bar: title, search `Input` (submits to same route), "Add product"
  button visible to admin only.
- Row actions: "Edit" and "Delete" visible to admin only. Staff row is
  non-interactive.
- Empty state text differs by role.

### 7.3 `/products/new`

- Admin only (middleware + RLS).
- shadcn `Form` with fields: SKU, Name, Description, Category, Price,
  Cost, Stock.
- Client-side validation: required fields, non-negative numbers.
- Submits `createProduct` server action.
- On success: toast, redirect to `/products/[newId]`.

### 7.4 `/products/[id]`

- Server component loads the product.
- Same form fields as create. Populated with current values.
- Admin: enabled, with "Save" and "Delete" buttons.
- Staff: all inputs disabled, no buttons — read-only view.
- Delete uses shadcn `AlertDialog` for confirmation, then calls
  `deleteProduct` server action and redirects to `/products`.

### 7.5 Shared `(app)` layout

- Top nav: brand on left. "Products" link. Role badge showing "Admin"
  or "Staff". Sign-out button (POSTs to `/auth/signout`).

### 7.6 What's not in v1

- No dashboard/stats page.
- No pagination — hard cap of 500 products in list query.
- No image upload.
- No CSV import.
- No categories table (free text only).
- No stock movements / audit log.

## 8. Testing

### 8.1 Automated: RLS test script

`supabase/tests/rls.sql` — a psql-runnable script that:

1. Creates two test users via `auth.admin_create_user`. One is
   promoted to admin, one stays as staff.
2. For each user, sets `request.jwt.claim.sub` and attempts:
   - `insert` on `products` → expect success for admin, denied for staff.
   - `update` on `products` → expect success for admin, denied for staff.
   - `delete` on `products` → expect success for admin, denied for staff.
   - `select` on `products` → expect success for both.
   - `update` on `profiles.role` → expect denied for staff even on own row.
3. Cleans up test users at the end.

Run manually after each migration change. Documented in the README.

### 8.2 Manual smoke checklist (in README)

**Admin flow**
- Sign in as admin.
- Product list loads. "Add product" button visible.
- Create a product. Redirects to detail page. Values are correct.
- Edit the product. "Saved" toast fires. List reflects the change.
- Delete the product. Confirmation dialog appears. On confirm, list no
  longer shows the product.
- Search by name and by SKU each return the expected row.

**Staff flow**
- Sign in as staff.
- Product list loads. "Add product" button is NOT visible.
- Row actions (Edit/Delete) are NOT visible.
- Navigating directly to `/products/new` redirects to `/products`.
- Navigating to `/products/[id]` shows a disabled, read-only form with
  no action buttons.

**Auth**
- Wrong password shows an inline error.
- Sign out clears the session and returns to `/login`.

### 8.3 What's not tested

- No Playwright / E2E suite. Cost/value ratio doesn't clear the bar
  for v1.
- No unit tests on server actions. They are 5-line wrappers over
  `supabase.from(...).insert(...)`. Mocking Supabase mostly tests the mock.
- No component tests. shadcn components are tested upstream.

## 9. Environment

`.env.local` requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`.env.local.example` is committed with placeholder values and the
README explains where to find each in the Supabase dashboard
(Settings → API).

## 10. Delivery

1. Scaffold Next.js + Tailwind + shadcn/ui.
2. Add Supabase client files, middleware, `lib/auth.ts`.
3. Write `supabase/migrations/0001_init.sql`.
4. Build login page.
5. Build products list, create, detail/edit pages, server actions.
6. Write `supabase/tests/rls.sql`.
7. Write README (setup, first-admin promotion, smoke checklist).

Detailed step-by-step plan lives in the implementation plan document
that follows this spec.

## 11. Known deferrals

Documenting because future-you will want them:

- **Stock movements table** — needed the moment you want to answer
  "why did stock change?". Would replace direct edits to
  `products.stock` with inserts into `stock_movements`, and derive
  current stock from a sum (or maintain a cached column).
- **Categories table** — needed once you want to rename a category in
  one place, or attach metadata (color, sort order) to categories.
- **Low-stock alerts** — add a `reorder_threshold` column on products
  and a dashboard tile.
- **Suppliers** — a `suppliers` table and a `supplier_id` FK on
  products.
- **Multi-location** — a `locations` table plus a `product_stock`
  join table keyed by `(product_id, location_id)`. Non-trivial.
- **Audit log across the board** — Supabase's `pg_audit`, or a custom
  `audit_log` table with triggers.
