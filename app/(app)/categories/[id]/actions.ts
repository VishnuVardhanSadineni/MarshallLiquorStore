"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  if (name.length > 60) throw new Error("Category name is too long.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new Error(`A category named "${name}" already exists.`);
    }
    throw new Error(error.message);
  }

  revalidatePath("/categories");
  revalidatePath(`/categories/${id}`);
  revalidatePath("/products");
  redirect(`/categories/${id}`);
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/categories");
  revalidatePath("/products");
  redirect("/categories");
}
