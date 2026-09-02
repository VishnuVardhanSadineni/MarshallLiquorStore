"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteImage, uploadImage } from "@/lib/supabase/storage";

const BUCKET = "category-images";

export async function updateCategory(id: string, formData: FormData) {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const photo = formData.get("photo");
  const removePhoto = formData.get("remove_photo") === "1";

  if (!name) throw new Error("Category name is required.");
  if (name.length > 60) throw new Error("Category name is too long.");

  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("categories")
    .select("image_url")
    .eq("id", id)
    .single();
  if (readError) throw new Error(readError.message);

  const existingUrl: string | null = existing?.image_url ?? null;
  let nextImageUrl: string | null = existingUrl;
  let previousUrlToDelete: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    nextImageUrl = await uploadImage(supabase, BUCKET, photo);
    previousUrlToDelete = existingUrl;
  } else if (removePhoto) {
    nextImageUrl = null;
    previousUrlToDelete = existingUrl;
  }

  const { error } = await supabase
    .from("categories")
    .update({ name, description, image_url: nextImageUrl })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new Error(`A category named "${name}" already exists.`);
    }
    throw new Error(error.message);
  }

  if (previousUrlToDelete) {
    await deleteImage(supabase, BUCKET, previousUrlToDelete);
  }

  revalidatePath("/categories");
  revalidatePath(`/categories/${id}`);
  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/categories/${id}`);
}

export async function deleteCategory(id: string) {
  await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("categories")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (existing?.image_url) {
    await deleteImage(supabase, BUCKET, existing.image_url);
  }

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/categories");
}
