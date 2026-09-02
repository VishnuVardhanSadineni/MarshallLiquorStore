-- =========================================================
-- Category images and descriptions
-- =========================================================

alter table public.categories
  add column if not exists image_url text,
  add column if not exists description text;

-- =========================================================
-- Storage bucket: category-images
-- Public read; writes gated by is_admin().
-- =========================================================
insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do update set public = true;

drop policy if exists "category_images_read_public" on storage.objects;
drop policy if exists "category_images_insert_admin" on storage.objects;
drop policy if exists "category_images_update_admin" on storage.objects;
drop policy if exists "category_images_delete_admin" on storage.objects;

create policy "category_images_read_public"
on storage.objects for select
using (bucket_id = 'category-images');

create policy "category_images_insert_admin"
on storage.objects for insert
to authenticated
with check (bucket_id = 'category-images' and public.is_admin());

create policy "category_images_update_admin"
on storage.objects for update
to authenticated
using (bucket_id = 'category-images' and public.is_admin())
with check (bucket_id = 'category-images' and public.is_admin());

create policy "category_images_delete_admin"
on storage.objects for delete
to authenticated
using (bucket_id = 'category-images' and public.is_admin());
