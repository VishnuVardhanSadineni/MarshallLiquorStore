"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateTeamMember(id: string, formData: FormData) {
  const profile = await requireAdmin();
  const currentUser = await getUser();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff");

  if (!full_name) throw new Error("Full name is required.");
  if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
  if (password && password.length < 8)
    throw new Error("Password must be at least 8 characters.");
  if (role !== "staff" && role !== "admin")
    throw new Error("Role must be staff or admin.");

  // Guard: admins cannot demote themselves.
  if (id === currentUser?.id && role !== "admin" && profile.role === "admin") {
    throw new Error("You cannot change your own role.");
  }

  const admin = createAdminClient();

  const authUpdate: { email?: string; password?: string } = {};
  if (email) authUpdate.email = email;
  if (password) authUpdate.password = password;

  if (Object.keys(authUpdate).length > 0) {
    const { error: authError } = await admin.auth.admin.updateUserById(
      id,
      authUpdate,
    );
    if (authError) throw new Error(authError.message);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name, role })
    .eq("id", id);
  if (profileError) throw new Error(profileError.message);

  revalidatePath("/team");
  revalidatePath(`/team/${id}`);
  redirect(`/team/${id}`);
}

export async function deleteTeamMember(id: string) {
  await requireAdmin();
  const currentUser = await getUser();

  if (id === currentUser?.id) {
    throw new Error("You cannot delete your own account.");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);

  revalidatePath("/team");
  redirect("/team");
}
