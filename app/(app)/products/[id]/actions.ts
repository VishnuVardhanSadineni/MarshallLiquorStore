"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import {
  deleteProductPhoto,
  uploadProductPhoto,
} from "../photo-storage";

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseCategoryId(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v ? v : null;
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category_id = parseCategoryId(formData.get("category_id"));
  const price = parseNumber(formData.get("price"));
  const cost = parseNumber(formData.get("cost"));
  const stock = parseNumber(formData.get("stock")) ?? 0;
  const photo = formData.get("photo");
  const removePhoto = formData.get("remove_photo") === "1";

  if (!sku || !name || price === null || price < 0 || stock < 0) {
    throw new Error("Missing or invalid fields");
  }

  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .single();
  if (readError) throw new Error(readError.message);

  const existingUrl: string | null = existing?.image_url ?? null;
  let nextImageUrl: string | null = existingUrl;
  let previousUrlToDelete: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    nextImageUrl = await uploadProductPhoto(supabase, photo);
    previousUrlToDelete = existingUrl;
  } else if (removePhoto) {
    nextImageUrl = null;
    previousUrlToDelete = existingUrl;
  }

  const { error } = await supabase
    .from("products")
    .update({
      sku,
      name,
      description,
      category_id,
      price,
      cost,
      stock,
      image_url: nextImageUrl,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  if (previousUrlToDelete) {
    await deleteProductPhoto(supabase, previousUrlToDelete);
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (existing?.image_url) {
    await deleteProductPhoto(supabase, existing.image_url);
  }

  revalidatePath("/products");
  redirect("/products");
}
