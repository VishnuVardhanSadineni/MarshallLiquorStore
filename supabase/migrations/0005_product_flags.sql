-- =========================================================
-- Product visibility flags
-- =========================================================

alter table public.products
  add column if not exists is_active  boolean not null default true,
  add column if not exists is_special boolean not null default false;

create index if not exists products_is_active_idx  on public.products (is_active);
create index if not exists products_is_special_idx on public.products (is_special) where is_special = true;
