-- =========================================================
-- Orders
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text unique not null,
  first_name       text not null,
  last_name        text not null,
  phone            text not null,
  pickup_notes     text,
  age_verified     boolean not null default false,
  status           text not null default 'pending'
                     check (status in ('pending','confirmed','ready','picked_up','cancelled')),
  subtotal_cents   integer not null check (subtotal_cents >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx     on public.orders (status);
create index if not exists orders_phone_idx      on public.orders (phone);

alter table public.orders enable row level security;

drop policy if exists "orders_select_authenticated" on public.orders;
drop policy if exists "orders_update_authenticated" on public.orders;
drop policy if exists "orders_delete_authenticated" on public.orders;

create policy "orders_select_authenticated"
on public.orders for select
to authenticated
using (true);

create policy "orders_update_authenticated"
on public.orders for update
to authenticated
using (true) with check (true);

create policy "orders_delete_authenticated"
on public.orders for delete
to authenticated
using (true);
-- No public INSERT policy — inserts happen server-side via the admin client.

-- =========================================================
-- Order items (snapshot of what was bought)
-- =========================================================
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  product_name      text not null,
  product_sku       text not null,
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  quantity          integer not null check (quantity > 0),
  created_at        timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_authenticated" on public.order_items;
drop policy if exists "order_items_delete_authenticated" on public.order_items;

create policy "order_items_select_authenticated"
on public.order_items for select
to authenticated
using (true);

create policy "order_items_delete_authenticated"
on public.order_items for delete
to authenticated
using (true);

-- =========================================================
-- updated_at trigger for orders
-- =========================================================
create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_orders_updated_at();
