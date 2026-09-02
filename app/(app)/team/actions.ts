"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createTeamMember(formData: FormData) {
  await requireAdmin();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff");

  if (!full_name) throw new Error("Full name is required.");
  if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
  if (password.length < 8)
    throw new Error("Password must be at least 8 characters.");
  if (role !== "staff" && role !== "admin")
    throw new Error("Role must be staff or admin.");

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created?.user) {
    throw new Error(createError?.message ?? "Failed to create user.");
  }

  const userId = created.user.id;

  // The handle_new_user trigger already inserted a profiles row with
  // role='staff'. Update it with the chosen name and role.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name, role })
    .eq("id", userId);

  if (profileError) {
    // Best-effort rollback so we don't leave an orphan auth user.
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    throw new Error(profileError.message);
  }

  revalidatePath("/team");
  redirect(`/team/${userId}`);
}
