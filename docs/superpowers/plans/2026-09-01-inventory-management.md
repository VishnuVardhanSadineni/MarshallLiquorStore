# Inventory Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Next.js + Supabase app that lets an admin manage a
product catalog (create/edit/delete) and lets staff view it read-only,
with roles enforced by Supabase RLS.

**Architecture:** Next.js 15 App Router. Cookie-based auth via
`@supabase/ssr`. Two tables (`profiles`, `products`) with RLS
policies backed by an `is_admin()` SQL function. Server components
for reads, server actions for writes. Middleware refreshes the
session and gates `(app)/*` routes. shadcn/ui + Tailwind for UI.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui,
`@supabase/ssr`, `@supabase/supabase-js`, sonner.

**Spec:** `docs/superpowers/specs/2026-09-01-inventory-management-design.md`

## Global Constraints

- **Working directory:** `/Users/shubakar/Desktop/Work/InventoryManagement`. The `docs/` folder already exists there and must be preserved.
- **Package manager:** npm.
- **Node:** 18.18+ (required by Next.js 15).
- **Runtime:** Next.js App Router only. No Pages Router.
- **Auth:** email + password only. Signup UI is NOT exposed.
- **Role check:** `is_admin()` SQL function is the single source of truth. UI hides admin-only controls; RLS + middleware enforce them.
- **No stock movements table.** `products.stock` is edited directly.
- **No categories table.** `products.category` is free text.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nothing else.
- **List cap:** product list query uses `.limit(500)`. No pagination in v1.
- **shadcn components used:** `button`, `input`, `textarea`, `label`, `table`, `card`, `badge`, `alert-dialog`, `sonner`. No `form` (using plain `<form>` + server actions).

---

### Task 1: Scaffold Next.js + shadcn/ui

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components.json`, `lib/utils.ts`, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/label.tsx`, `components/ui/table.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/alert-dialog.tsx`, `components/ui/sonner.tsx`, `.env.local.example`, `.gitignore`
- Modify: `app/page.tsx` (replace default landing with a redirect)

**Interfaces:**
- Consumes: nothing.
- Produces: a Next.js 15 App Router project that builds. Provides shadcn primitives under `@/components/ui/*` and a `cn()` util at `@/lib/utils`.

- [ ] **Step 1: Scaffold Next.js into the current directory**

Run in `/Users/shubakar/Desktop/Work/InventoryManagement`:

```bash
npx --yes create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm \
  --skip-install
```

If `create-next-app` refuses because the directory is non-empty (the `docs/` folder is present), scaffold to a temp dir and move files:

```bash
npx --yes create-next-app@latest /tmp/inv-scaffold \
  --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --skip-install
rsync -a --exclude 'docs' /tmp/inv-scaffold/ ./
rm -rf /tmp/inv-scaffold
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Verify baseline build works**

```bash
npx next build
```

Expected: build succeeds, produces `.next/` output. If it fails, do NOT proceed.

- [ ] **Step 4: Initialize shadcn/ui**

```bash
npx --yes shadcn@latest init -d
```

Choose defaults (Neutral base color, CSS variables). This creates `components.json`, `lib/utils.ts`, and updates `app/globals.css` and `tailwind.config.ts`.

- [ ] **Step 5: Add shadcn components used by this project**

```bash
npx --yes shadcn@latest add button input textarea label table card badge alert-dialog sonner
```

- [ ] **Step 6: Replace `app/page.tsx` with a redirect**

Overwrite `app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/products");
}
```

- [ ] **Step 7: Add `.env.local.example`**

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

- [ ] **Step 8: Confirm `.env.local` is gitignored**

Check `.gitignore` contains `.env*.local`. It should by default from `create-next-app`. If missing, append it.

- [ ] **Step 9: Verify the build still passes**

```bash
npx next build
```

Expected: PASS. The redirect page has no runtime because there's no `/products` route yet — but the build only does static analysis, so this is fine. If build fails with a routing error, ignore only if the error is specifically about the missing `/products` route.

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold next.js + shadcn/ui"
```

---

### Task 2: Supabase migration — schema, triggers, RLS

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: two tables (`public.profiles`, `public.products`), one SQL function (`public.is_admin()`), two triggers (`on_auth_user_created`, `set_products_updated_at`), and RLS policies. Referenced by Task 4 (middleware role gate) and Task 10 (RLS tests).

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/0001_init.sql`:

```sql
-- Enable pgcrypto for gen_random_uuid (usually already on)
create extension if not exists pgcrypto;

-- =========================================================
-- profiles
-- =========================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'staff' check (role in ('admin','staff')),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- =========================================================
-- products
-- =========================================================
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  sku          text unique not null,
  name         text not null,
  description  text,
  category     text,
  price        numeric(10,2) not null check (price >= 0),
  cost         numeric(10,2) check (cost >= 0),
  stock        integer not null default 0 check (stock >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index products_category_idx on public.products (category);

alter table public.products enable row level security;

-- =========================================================
-- is_admin() helper
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- =========================================================
-- Auth user -> profile trigger
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- updated_at trigger for products
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- =========================================================
-- RLS policies: profiles
-- =========================================================
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (auth.uid() = id or public.is_admin());

create policy "profiles_update_admin_only"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- No insert/delete policy: insert happens via trigger,
-- delete cascades from auth.users.

-- =========================================================
-- RLS policies: products
-- =========================================================
create policy "products_select_authenticated"
on public.products for select
to authenticated
using (true);

create policy "products_insert_admin"
on public.products for insert
to authenticated
with check (public.is_admin());

create policy "products_update_admin"
on public.products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "products_delete_admin"
on public.products for delete
to authenticated
using (public.is_admin());
```

- [ ] **Step 2: Apply the migration to your Supabase project**

Open the Supabase dashboard → SQL Editor → New query. Paste the entire contents of `supabase/migrations/0001_init.sql`. Click **Run**.

Expected: `Success. No rows returned.`

- [ ] **Step 3: Verify tables were created**

In the SQL Editor, run:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected: rows include `products` and `profiles`.

- [ ] **Step 4: Verify RLS is on**

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename in ('products','profiles');
```

Expected: both rows show `rowsecurity = true`.

- [ ] **Step 5: Create the first user and promote to admin**

Dashboard → Authentication → Users → **Add user** → Email + password. Copy the resulting user UUID from the users table.

Back in SQL Editor:

```sql
update public.profiles set role = 'admin' where id = '<paste-uuid-here>';
select id, role from public.profiles;
```

Expected: one row, role = `admin`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat(db): initial schema, RLS, and auth trigger"
```

---

### Task 3: Supabase clients (server, browser, middleware helper)

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`
- Modify: `package.json` (adds `@supabase/ssr`, `@supabase/supabase-js`)

**Interfaces:**
- Consumes: env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Produces:
  - `createClient()` from `@/lib/supabase/server` — async, returns a cookie-aware `SupabaseClient` for server components and server actions.
  - `createClient()` from `@/lib/supabase/client` — sync, returns a browser `SupabaseClient`.
  - `updateSession(request: NextRequest): Promise<NextResponse>` from `@/lib/supabase/middleware` — refreshes the auth cookies and returns a response. Used by Task 4.

- [ ] **Step 1: Install Supabase dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: Create the server client**

Create `lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies are read-only there.
            // Middleware handles session refresh, so this is safe to ignore.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create the browser client**

Create `lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Create the middleware helper**

Create `lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
```

- [ ] **Step 5: Create your local env file**

Copy the example and fill in real values from Supabase dashboard → Settings → API:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste the real URL and anon key. This file is gitignored.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS with zero errors.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase package.json package-lock.json .env.local.example
git commit -m "feat(supabase): add server, browser, and middleware clients"
```

---

### Task 4: Root middleware — session refresh + route gating

**Files:**
- Create: `middleware.ts`, `lib/auth.ts`

**Interfaces:**
- Consumes: `updateSession` from `@/lib/supabase/middleware`.
- Produces:
  - `middleware.ts` at the project root, exporting `middleware(request)` and a `config.matcher`.
  - `getUser()` from `@/lib/auth` — server helper returning `User | null`.
  - `getProfile()` from `@/lib/auth` — server helper returning `{ id: string; role: "admin" | "staff"; full_name: string | null } | null`.
  - `requireAdmin()` from `@/lib/auth` — server helper that redirects to `/products` if the caller is not admin.
  - `requireUser()` from `@/lib/auth` — server helper that redirects to `/login` if unauthenticated.

- [ ] **Step 1: Write `lib/auth.ts`**

Create `lib/auth.ts`:

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "staff";
export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
};

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/products");
  return profile;
}
```

- [ ] **Step 2: Write `middleware.ts`**

Create `middleware.ts` at the project root:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_ROUTES = ["/products"];
const ADMIN_ONLY_PREFIXES = ["/products/new"];

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isAuthRoute = AUTH_ROUTES.some(
    (base) => path === base || path.startsWith(`${base}/`)
  );

  if (isAuthRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && ADMIN_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (data?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/products";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Smoke test — unauthenticated redirect**

```bash
npm run dev
```

In a browser, open `http://localhost:3000/products`.

Expected: redirects to `http://localhost:3000/login`. The login route doesn't exist yet, so you'll see a 404 — that's fine. What matters is the redirect happened.

Stop the dev server (`Ctrl+C`).

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts middleware.ts
git commit -m "feat(auth): session middleware and auth helpers"
```

---

### Task 5: Login page + sign-out route

**Files:**
- Create: `app/login/page.tsx`, `app/auth/signout/route.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client` and `@/lib/supabase/server`.
- Produces: a functional login form at `/login` and a `POST /auth/signout` route that clears the session and redirects to `/login`.

- [ ] **Step 1: Create the login page**

Create `app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/products");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create the sign-out route**

Create `app/auth/signout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Smoke test — sign in**

```bash
npm run dev
```

Open `http://localhost:3000/login`. Sign in with the admin email/password created in Task 2, Step 5.

Expected: redirects to `/products`. That route 404s for now — that's OK. Also try a wrong password and confirm the error message appears inline.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add app/login app/auth
git commit -m "feat(auth): login page and sign-out route"
```

---

### Task 6: Authenticated app shell — `(app)` layout

**Files:**
- Create: `app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `requireUser`, `getProfile` from `@/lib/auth`.
- Produces: a top nav visible on every authenticated route, with brand, "Products" link, role badge, and a sign-out form that POSTs to `/auth/signout`. Also mounts the `<Toaster />` from sonner.

- [ ] **Step 1: Create the layout**

Create `app/(app)/layout.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/products" className="font-semibold">
              Inventory
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/products"
                className="text-muted-foreground hover:text-foreground"
              >
                Products
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
              {profile.role === "admin" ? "Admin" : "Staff"}
            </Badge>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/layout.tsx"
git commit -m "feat(ui): authenticated app shell with nav"
```

---

### Task 7: Products list page (with search)

**Files:**
- Create: `app/(app)/products/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `getProfile` from `@/lib/auth`.
- Produces: a server-rendered page at `/products` that lists products in a table, supports `?q=` search on `name` and `sku`, and shows admin-only controls conditionally.

- [ ] **Step 1: Write the page**

Create `app/(app)/products/page.tsx`:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("products")
    .select("id, sku, name, category, price, stock")
    .order("created_at", { ascending: false })
    .limit(500);

  if (q && q.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  const { data: products, error } = await query;

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load products: {error.message}
      </div>
    );
  }

  const rows = (products ?? []) as Product[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Products</h1>
        {isAdmin && (
          <Button asChild>
            <Link href="/products/new">Add product</Link>
          </Button>
        )}
      </div>

      <form className="flex gap-2" action="/products" method="get">
        <Input
          name="q"
          placeholder="Search by name or SKU"
          defaultValue={q ?? ""}
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {rows.length === 0 ? (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          {isAdmin
            ? "No products yet. Add your first product."
            : "No products yet."}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(p.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/products/${p.id}`}>
                        {isAdmin ? "Edit" : "View"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Smoke test — admin view**

```bash
npm run dev
```

Sign in as admin, then open `/products`.

Expected: page loads. "Add product" button visible. Empty state message shows because you haven't created any products yet.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/products/page.tsx"
git commit -m "feat(products): list page with search"
```

---

### Task 8: Product create page + `createProduct` server action

**Files:**
- Create: `app/(app)/products/new/page.tsx`, `app/(app)/products/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `requireAdmin` from `@/lib/auth`.
- Produces:
  - Server action `createProduct(formData: FormData)` that inserts a product and redirects to `/products/[id]`.
  - Page at `/products/new` with a form. Middleware gates non-admin users out of this route.

- [ ] **Step 1: Write the server action**

Create `app/(app)/products/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const price = parseNumber(formData.get("price"));
  const cost = parseNumber(formData.get("cost"));
  const stock = parseNumber(formData.get("stock")) ?? 0;

  if (!sku || !name || price === null || price < 0 || stock < 0) {
    throw new Error("Missing or invalid fields");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ sku, name, description, category, price, cost, stock })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  redirect(`/products/${data.id}`);
}
```

- [ ] **Step 2: Write the new-product page**

Create `app/(app)/products/new/page.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createProduct } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add product</h1>
        <Button asChild variant="ghost">
          <Link href="/products">Cancel</Link>
        </Button>
      </div>

      <form action={createProduct} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cost</Label>
            <Input id="cost" name="cost" type="number" step="0.01" min="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              step="1"
              min="0"
              defaultValue={0}
              required
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Create product</Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Smoke test — create a product as admin**

```bash
npm run dev
```

Sign in as admin. Click "Add product". Fill in SKU `SKU-001`, Name `Test widget`, Price `9.99`, Stock `10`. Submit.

Expected: redirect to `/products/<id>` (which 404s for now — that's fine). Go back to `/products`. Expected: the new product appears in the table.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/products/actions.ts" "app/(app)/products/new"
git commit -m "feat(products): create page and server action"
```

---

### Task 9: Product detail/edit page + update/delete actions

**Files:**
- Create: `app/(app)/products/[id]/page.tsx`, `app/(app)/products/[id]/actions.ts`, `app/(app)/products/[id]/delete-button.tsx`

**Interfaces:**
- Consumes: `createClient`, `requireAdmin`, `getProfile`.
- Produces:
  - Server actions `updateProduct(id, formData)` and `deleteProduct(id)`.
  - Detail page at `/products/[id]`. Admin sees editable form + Save + Delete. Staff sees disabled form only.
  - A client component wrapping the Delete button with an `AlertDialog` confirmation.

- [ ] **Step 1: Write the update/delete actions**

Create `app/(app)/products/[id]/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const price = parseNumber(formData.get("price"));
  const cost = parseNumber(formData.get("cost"));
  const stock = parseNumber(formData.get("stock")) ?? 0;

  if (!sku || !name || price === null || price < 0 || stock < 0) {
    throw new Error("Missing or invalid fields");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ sku, name, description, category, price, cost, stock })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/products");
  redirect("/products");
}
```

- [ ] **Step 2: Write the delete confirmation button**

Create `app/(app)/products/[id]/delete-button.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProduct } from "./actions";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteProduct(id);
              })
            }
          >
            {pending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 3: Write the detail page**

Create `app/(app)/products/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { updateProduct } from "./actions";
import { DeleteButton } from "./delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  price: string;
  cost: string | null;
  stock: number;
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const { data, error } = await supabase
    .from("products")
    .select("id, sku, name, description, category, price, cost, stock")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const product = data as Product;

  const boundUpdate = updateProduct.bind(null, product.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isAdmin ? "Edit product" : product.name}
        </h1>
        <Button asChild variant="ghost">
          <Link href="/products">Back</Link>
        </Button>
      </div>

      <form action={boundUpdate} className="space-y-4">
        <fieldset disabled={!isAdmin} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product.sku} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                defaultValue={product.category ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={product.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.price}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.cost ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                step="1"
                min="0"
                defaultValue={product.stock}
                required
              />
            </div>
          </div>
        </fieldset>

        {isAdmin && (
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <DeleteButton id={product.id} name={product.name} />
          </div>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Smoke test — edit and delete as admin**

```bash
npm run dev
```

Sign in as admin. Open the product created in Task 8. Change the price. Click Save.

Expected: page reloads with the new price. Go to `/products`, confirm the updated price shows.

Back on the detail page, click Delete → confirm.

Expected: redirect to `/products`, the row is gone.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/products/[id]"
git commit -m "feat(products): detail, edit, and delete"
```

---

### Task 10: RLS test script

**Files:**
- Create: `supabase/tests/rls.sql`

**Interfaces:**
- Consumes: the schema from Task 2.
- Produces: a psql-runnable script that provisions two test users (one admin, one staff) and asserts RLS behavior on `products` and `profiles`. Cleans up its own users at the end.

- [ ] **Step 1: Write the test script**

Create `supabase/tests/rls.sql`:

```sql
-- =========================================================
-- RLS test script for inventory-management
--
-- Run in Supabase SQL Editor (or psql). All ASSERT calls
-- must succeed. Any RAISE EXCEPTION means a policy is wrong.
-- Cleans up its own test data at the end.
-- =========================================================

do $$
declare
  admin_uid uuid;
  staff_uid uuid;
  test_product_id uuid;
  denied boolean;
begin
  -- Create two auth users via the admin API (requires service_role
  -- context; SQL Editor runs as service_role by default).
  admin_uid := (
    select id from auth.users where email = 'rls-admin@example.test'
  );
  if admin_uid is null then
    admin_uid := extensions.uuid_generate_v4();
    insert into auth.users (id, email, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (admin_uid, 'rls-admin@example.test', now(), 'authenticated', 'authenticated', '{}', '{}', now(), now());
  end if;

  staff_uid := (
    select id from auth.users where email = 'rls-staff@example.test'
  );
  if staff_uid is null then
    staff_uid := extensions.uuid_generate_v4();
    insert into auth.users (id, email, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (staff_uid, 'rls-staff@example.test', now(), 'authenticated', 'authenticated', '{}', '{}', now(), now());
  end if;

  -- The handle_new_user trigger inserts profiles rows.
  -- Force role values.
  update public.profiles set role = 'admin' where id = admin_uid;
  update public.profiles set role = 'staff' where id = staff_uid;

  -- ==========================================
  -- Simulate the admin session
  -- ==========================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_uid::text, 'role', 'authenticated')::text,
    true);

  -- Admin can insert
  insert into public.products (sku, name, price, stock)
  values ('RLS-TEST-1', 'RLS test product', 1.00, 1)
  returning id into test_product_id;

  -- Admin can update
  update public.products set price = 2.00 where id = test_product_id;

  -- Admin can select
  perform 1 from public.products where id = test_product_id;

  -- ==========================================
  -- Simulate the staff session
  -- ==========================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', staff_uid::text, 'role', 'authenticated')::text,
    true);

  -- Staff can select
  if not exists (select 1 from public.products where id = test_product_id) then
    raise exception 'FAIL: staff cannot select products';
  end if;

  -- Staff cannot insert
  denied := false;
  begin
    insert into public.products (sku, name, price, stock)
    values ('RLS-TEST-STAFF', 'should fail', 1.00, 1);
  exception when others then
    denied := true;
  end;
  if not denied then
    raise exception 'FAIL: staff was able to insert';
  end if;

  -- Staff cannot update
  denied := false;
  begin
    update public.products set price = 999.00 where id = test_product_id;
    -- If no rows are updated, that's also a denial via RLS.
    if not found then denied := true; end if;
  exception when others then
    denied := true;
  end;
  if not denied then
    raise exception 'FAIL: staff was able to update';
  end if;

  -- Staff cannot delete
  denied := false;
  begin
    delete from public.products where id = test_product_id;
    if not found then denied := true; end if;
  exception when others then
    denied := true;
  end;
  if not denied then
    raise exception 'FAIL: staff was able to delete';
  end if;

  -- Staff cannot self-promote
  denied := false;
  begin
    update public.profiles set role = 'admin' where id = staff_uid;
    if not found then denied := true; end if;
  exception when others then
    denied := true;
  end;
  if not denied then
    raise exception 'FAIL: staff was able to change own role';
  end if;

  -- ==========================================
  -- Cleanup as service_role
  -- ==========================================
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'postgres', true);

  delete from public.products where id = test_product_id;
  delete from auth.users where id in (admin_uid, staff_uid);

  raise notice 'RLS tests passed';
end $$;
```

- [ ] **Step 2: Run the script in the Supabase SQL Editor**

Paste the entire file, click Run.

Expected: the output includes `NOTICE: RLS tests passed`. No `ERROR`. If any assertion fails, the DB state is rolled back inside the `do` block.

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/rls.sql
git commit -m "test(db): RLS assertions for admin vs staff"
```

---

### Task 11: README with setup and smoke checklist

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: everything the earlier tasks built.
- Produces: an onboarding doc that another person could follow to get the app running.

- [ ] **Step 1: Write the README**

Create `README.md`:

```markdown
# Inventory Management

Basic inventory system for a single-location retail store. Admin
manages the product catalog; staff view it read-only. Roles are
enforced by Supabase Row Level Security.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with setup and smoke checklist"
```

---

## Self-Review

**Spec coverage:**
- Two tables, `is_admin()`, triggers, RLS — Task 2.
- Auth (email+password, invite-only) — Tasks 2 & 5.
- Two Supabase clients + middleware helper — Task 3.
- Middleware gates + admin-only prefix guard — Task 4.
- `(app)` layout with nav, role badge, sign-out — Task 6.
- `/products` list with `?q=` search, admin-only "Add" button, empty state — Task 7.
- `/products/new` admin-only + `createProduct` action — Task 8.
- `/products/[id]` role-aware form + update/delete actions + confirmation dialog — Task 9.
- RLS test script — Task 10.
- README + manual smoke checklist — Task 11.
- `.env.local.example` + gitignored `.env.local` — Task 1 & 3.
- List cap of 500 — Task 7.

**Placeholder scan:** none found. Every code step contains real code.

**Type consistency:**
- `createClient` — used consistently from `@/lib/supabase/server` (async) and `@/lib/supabase/client` (sync).
- `getProfile` / `requireAdmin` / `requireUser` / `getUser` — defined in Task 4 (`lib/auth.ts`), consumed in Tasks 6, 7, 8, 9.
- `updateSession` — defined in Task 3, consumed in Task 4.
- Server actions: `createProduct(formData)` (Task 8), `updateProduct(id, formData)` (Task 9), `deleteProduct(id)` (Task 9). Consistent signatures.
- `DeleteButton` — defined in Task 9, consumed in Task 9.
- Product row shape used in list (Task 7) is a subset of the one in detail (Task 9); no conflict.
