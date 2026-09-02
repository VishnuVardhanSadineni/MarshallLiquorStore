"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = new Set([
  "pending",
  "confirmed",
  "ready",
  "picked_up",
  "cancelled",
]);

const PHONE_RE = /^[\d\s\-().+]{7,20}$/;

export async function updateOrder(id: string, formData: FormData) {
  await requireUser();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const pickupNotes =
    String(formData.get("pickup_notes") ?? "").trim() || null;

  if (!firstName) throw new Error("First name is required.");
  if (!lastName) throw new Error("Last name is required.");
  if (!phone || !PHONE_RE.test(phone))
    throw new Error("Enter a valid phone number.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      pickup_notes: pickupNotes,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  redirect(`/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: string) {
  await requireUser();
  if (!VALID_STATUSES.has(status)) throw new Error("Invalid status.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}

export async function deleteOrder(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/orders");
  redirect("/orders");
}
