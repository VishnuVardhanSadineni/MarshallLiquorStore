-- =========================================================
-- Categories
-- =========================================================

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories_select_authenticated" on public.categories;
drop policy if exists "categories_insert_admin" on public.categories;
drop policy if exists "categories_update_admin" on public.categories;
drop policy if exists "categories_delete_admin" on public.categories;

create policy "categories_select_authenticated"
on public.categories for select
to authenticated
using (true);

create policy "categories_insert_admin"
on public.categories for insert
to authenticated
with check (public.is_admin());

create policy "categories_update_admin"
on public.categories for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "categories_delete_admin"
on public.categories for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- Wire products to categories
-- =========================================================

alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists products_category_id_idx on public.products (category_id);

-- Backfill: create category rows from distinct existing text values,
-- then point products at them.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'category'
  ) then
    insert into public.categories (name)
    select distinct btrim(category)
    from public.products
    where category is not null and btrim(category) <> ''
    on conflict (name) do nothing;

    update public.products p
    set category_id = c.id
    from public.categories c
    where p.category_id is null
      and p.category is not null
      and lower(btrim(p.category)) = lower(c.name);

    alter table public.products drop column category;
  end if;
end $$;
