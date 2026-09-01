# Inventory Management

Basic inventory system for a single-location retail store. Admin
manages the product catalog; staff view it read-only. Roles are
enforced by Supabase Row Level Security.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres, Auth, RLS)
- `@supabase/ssr` for cookie-based auth

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in real values from Supabase
   dashboard → Settings → API:

   ```bash
   cp .env.local.example .env.local
   ```

3. Apply the DB migration. Open the Supabase SQL Editor and paste
   the contents of `supabase/migrations/0001_init.sql`. Run it.

4. Create the first user. Dashboard → Authentication → Users →
   Add user. Copy the resulting UUID.

5. Promote that user to admin. In the SQL Editor:

   ```sql
   update public.profiles set role = 'admin' where id = '<uuid>';
   ```

6. (Optional) Run the RLS test script:

   ```sql
   -- Paste supabase/tests/rls.sql and run.
   -- Expect: NOTICE: RLS tests passed.
   ```

7. Start the dev server:

   ```bash
   npm run dev
   ```

## Manual smoke checklist

### Admin
- [ ] Sign in as admin at `/login`.
- [ ] Product list loads. "Add product" button is visible.
- [ ] Create a product. Redirects to the detail page. Values are correct.
- [ ] Edit the product. Save. List reflects the change.
- [ ] Delete the product. Confirmation dialog appears. On confirm, list no longer shows the product.
- [ ] Search by name and by SKU each return the expected row.

### Staff
- [ ] Sign in as a staff user.
- [ ] Product list loads. "Add product" button is NOT visible.
- [ ] Row action shows "View" instead of "Edit".
- [ ] Navigating directly to `/products/new` redirects to `/products`.
- [ ] `/products/[id]` shows a disabled, read-only form with no action buttons.

### Auth
- [ ] Wrong password shows an inline error.
- [ ] Sign out clears the session and returns to `/login`.

## Deferred (see the design spec)

Stock movements log, categories table, low-stock alerts, suppliers,
multi-location, image upload, CSV import, dashboard/stats.
