-- =========================================================
-- Let staff (not just admins) edit products and categories.
-- Team management (auth users, profiles) stays admin-only.
-- =========================================================

-- ---------- products ----------
drop policy if exists "products_insert_admin" on public.products;
drop policy if exists "products_update_admin" on public.products;
drop policy if exists "products_delete_admin" on public.products;

create policy "products_insert_authenticated"
on public.products for insert
to authenticated
with check (true);

create policy "products_update_authenticated"
on public.products for update
to authenticated
using (true)
with check (true);

create policy "products_delete_authenticated"
on public.products for delete
to authenticated
using (true);

-- ---------- categories ----------
drop policy if exists "categories_insert_admin" on public.categories;
drop policy if exists "categories_update_admin" on public.categories;
drop policy if exists "categories_delete_admin" on public.categories;

create policy "categories_insert_authenticated"
on public.categories for insert
to authenticated
with check (true);

create policy "categories_update_authenticated"
on public.categories for update
to authenticated
using (true)
with check (true);

create policy "categories_delete_authenticated"
on public.categories for delete
to authenticated
using (true);

-- ---------- product-images bucket ----------
drop policy if exists "product_images_insert_admin" on storage.objects;
drop policy if exists "product_images_update_admin" on storage.objects;
drop policy if exists "product_images_delete_admin" on storage.objects;

create policy "product_images_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "product_images_update_authenticated"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "product_images_delete_authenticated"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');

-- ---------- category-images bucket ----------
drop policy if exists "category_images_insert_admin" on storage.objects;
drop policy if exists "category_images_update_admin" on storage.objects;
drop policy if exists "category_images_delete_admin" on storage.objects;

create policy "category_images_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'category-images');

create policy "category_images_update_authenticated"
on storage.objects for update
to authenticated
using (bucket_id = 'category-images')
with check (bucket_id = 'category-images');

create policy "category_images_delete_authenticated"
on storage.objects for delete
to authenticated
using (bucket_id = 'category-images');
