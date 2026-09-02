-- =========================================================
-- Product photos
-- =========================================================

-- Column on products
alter table public.products add column if not exists image_url text;

-- =========================================================
-- Storage bucket: product-images
-- Public read (product photos are fine to expose by URL).
-- Writes gated by is_admin().
-- =========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Clean up any prior policies so re-running is idempotent
drop policy if exists "product_images_read_public" on storage.objects;
drop policy if exists "product_images_insert_admin" on storage.objects;
drop policy if exists "product_images_update_admin" on storage.objects;
drop policy if exists "product_images_delete_admin" on storage.objects;

create policy "product_images_read_public"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product_images_insert_admin"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_update_admin"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_delete_admin"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());
