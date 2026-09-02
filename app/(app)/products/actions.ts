"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { uploadImage } from "@/lib/supabase/storage";

const PRODUCT_BUCKET = "product-images";

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseCategoryId(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v ? v : null;
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category_id = parseCategoryId(formData.get("category_id"));
  const price = parseNumber(formData.get("price"));
  const cost = parseNumber(formData.get("cost"));
  const stock = parseNumber(formData.get("stock")) ?? 0;
  const photo = formData.get("photo");

  if (!sku || !name || price === null || price < 0 || stock < 0) {
    throw new Error("Missing or invalid fields");
  }

  const supabase = await createClient();
  const image_url = await uploadImage(
    supabase,
    PRODUCT_BUCKET,
    photo instanceof File ? photo : null,
  );

  const { data, error } = await supabase
    .from("products")
    .insert({
      sku,
      name,
      description,
      category_id,
      price,
      cost,
      stock,
      image_url,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  redirect(`/products/${data.id}`);
}
