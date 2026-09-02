"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const NUMBER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
const PHONE_RE = /^[\d\s\-().+]{7,20}$/;

function generateOrderNumber() {
  let n = "MLS-";
  for (let i = 0; i < 5; i++) {
    n += NUMBER_CHARS[Math.floor(Math.random() * NUMBER_CHARS.length)];
  }
  return n;
}

export type CustomerInfo = {
  firstName: string;
  lastName: string;
  phone: string;
  pickupNotes: string;
  ageVerified: boolean;
};

export type OrderItemInput = {
  productId: string;
  quantity: number;
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(
  customer: CustomerInfo,
  itemsInput: OrderItemInput[],
): Promise<PlaceOrderResult> {
  const firstName = customer.firstName.trim();
  const lastName = customer.lastName.trim();
  const phone = customer.phone.trim();
  const pickupNotes = customer.pickupNotes.trim() || null;

  if (!firstName) return { ok: false, error: "First name is required." };
  if (!lastName) return { ok: false, error: "Last name is required." };
  if (!phone || !PHONE_RE.test(phone))
    return { ok: false, error: "Enter a valid phone number." };
  if (!customer.ageVerified)
    return { ok: false, error: "You must confirm you are 21 or older." };

  const items = itemsInput
    .filter((i) => i.quantity > 0 && i.productId)
    .map((i) => ({
      productId: i.productId,
      quantity: Math.floor(i.quantity),
    }));

  if (items.length === 0) return { ok: false, error: "Your cart is empty." };

  const admin = createAdminClient();

  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, sku, price, is_active")
    .in("id", productIds);

  if (productsError) return { ok: false, error: productsError.message };
  if (!products || products.length === 0)
    return { ok: false, error: "The bottles in your cart are no longer available." };

  const productMap = new Map<string, (typeof products)[number]>(
    products.map((p) => [p.id as string, p]),
  );

  let subtotalCents = 0;
  const orderItemSnapshots: {
    product_id: string;
    product_name: string;
    product_sku: string;
    unit_price_cents: number;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product)
      return {
        ok: false,
        error: "One of the bottles in your cart is no longer available.",
      };
    if (!product.is_active)
      return {
        ok: false,
        error: `${product.name} is no longer available. Please remove it from your cart.`,
      };
    const unitPriceCents = Math.round(Number(product.price) * 100);
    subtotalCents += unitPriceCents * item.quantity;
    orderItemSnapshots.push({
      product_id: item.productId,
      product_name: product.name as string,
      product_sku: product.sku as string,
      unit_price_cents: unitPriceCents,
      quantity: item.quantity,
    });
  }

  let orderId = "";
  let orderNumber = "";
  const maxRetries = 6;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    orderNumber = generateOrderNumber();
    const { data, error } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        first_name: firstName,
        last_name: lastName,
        phone,
        pickup_notes: pickupNotes,
        age_verified: true,
        status: "pending",
        subtotal_cents: subtotalCents,
      })
      .select("id")
      .single();
    if (!error && data) {
      orderId = data.id as string;
      break;
    }
    if (error?.code !== "23505") {
      return { ok: false, error: error?.message ?? "Failed to place order." };
    }
    if (attempt === maxRetries - 1) {
      return { ok: false, error: "Could not reserve an order number. Try again." };
    }
  }

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(orderItemSnapshots.map((s) => ({ ...s, order_id: orderId })));

  if (itemsError) {
    await admin.from("orders").delete().eq("id", orderId);
    return { ok: false, error: itemsError.message };
  }

  revalidatePath("/orders");
  revalidatePath(`/order/${orderNumber}`);
  return { ok: true, orderNumber };
}
