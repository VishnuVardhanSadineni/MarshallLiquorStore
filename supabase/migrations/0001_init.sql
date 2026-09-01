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
