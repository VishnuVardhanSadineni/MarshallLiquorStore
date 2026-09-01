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
