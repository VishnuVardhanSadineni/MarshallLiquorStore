"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/supabase/storage";

const BUCKET = "category-images";

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const photo = formData.get("photo");

  if (!name) throw new Error("Category name is required.");
  if (name.length > 60) throw new Error("Category name is too long.");

  const supabase = await createClient();
  const image_url = await uploadImage(
    supabase,
    BUCKET,
    photo instanceof File ? photo : null,
  );

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, description, image_url })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`A category named "${name}" already exists.`);
    }
    throw new Error(error.message);
  }

  revalidatePath("/categories");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/categories/${data.id}`);
}
