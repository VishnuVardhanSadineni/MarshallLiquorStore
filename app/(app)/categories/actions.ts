"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  if (name.length > 60) throw new Error("Category name is too long.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
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
  redirect(`/categories/${data.id}`);
}
